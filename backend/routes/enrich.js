const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');
const db = require('../db');

// Enrich a contact (LinkedIn + Website)
router.post('/:id', async (req, res) => {
  const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id);
  if (!contact) return res.status(404).json({ error: 'Contact not found' });

  const updates = {};
  const results = { linkedin: null, website: null };

  // --- LinkedIn enrichment ---
  if (contact.linkedin_url && process.env.PROXYCURL_API_KEY && process.env.PROXYCURL_API_KEY !== 'your_proxycurl_api_key_here') {
    try {
      const response = await axios.get('https://nubela.co/proxycurl/api/v2/linkedin', {
        params: { url: contact.linkedin_url, use_cache: 'if-present' },
        headers: { Authorization: `Bearer ${process.env.PROXYCURL_API_KEY}` },
        timeout: 15000,
      });
      const p = response.data;
      updates.linkedin_photo = p.profile_pic_url || '';
      updates.linkedin_headline = p.headline || '';
      updates.linkedin_location = [p.city, p.country_full_name].filter(Boolean).join(', ');

      // Get current company from experiences
      const currentExp = (p.experiences || []).find(e => !e.ends_at);
      updates.linkedin_company = currentExp?.company || (p.experiences?.[0]?.company) || '';

      // Fill in industry if empty
      if (!contact.industry && p.industry) {
        updates.industry = p.industry;
      }

      results.linkedin = { success: true, name: p.full_name };
    } catch (err) {
      const msg = err.response?.data?.description || err.message;
      results.linkedin = { success: false, error: msg };
    }
  } else if (contact.linkedin_url && !process.env.PROXYCURL_API_KEY) {
    results.linkedin = { success: false, error: 'PROXYCURL_API_KEY not set in .env file' };
  } else if (!contact.linkedin_url) {
    results.linkedin = { success: false, error: 'No LinkedIn URL on contact' };
  }

  // --- Website enrichment ---
  if (contact.website) {
    try {
      let url = contact.website;
      if (!url.startsWith('http')) url = 'https://' + url;

      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml',
        },
        maxRedirects: 5,
      });

      const $ = cheerio.load(response.data);

      updates.website_title =
        $('meta[property="og:title"]').attr('content') ||
        $('title').text().trim().slice(0, 200) || '';

      updates.website_description =
        $('meta[property="og:description"]').attr('content') ||
        $('meta[name="description"]').attr('content') || '';
      updates.website_description = updates.website_description.slice(0, 500);

      const faviconHref =
        $('link[rel="icon"]').attr('href') ||
        $('link[rel="shortcut icon"]').attr('href') ||
        '/favicon.ico';

      try {
        const base = new URL(url);
        updates.website_favicon = new URL(faviconHref, base).toString();
      } catch {
        updates.website_favicon = '';
      }

      results.website = { success: true, title: updates.website_title };
    } catch (err) {
      results.website = { success: false, error: err.message };
    }
  } else {
    results.website = { success: false, error: 'No website URL on contact' };
  }

  // Save updates if any
  if (Object.keys(updates).length > 0) {
    updates.enriched_at = new Date().toISOString();
    const setClauses = Object.keys(updates).map(k => `${k}=?`).join(', ');
    const values = Object.values(updates);
    db.prepare(`UPDATE contacts SET ${setClauses}, updated_at=datetime('now') WHERE id=?`)
      .run(...values, req.params.id);
  }

  const updated = db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id);
  res.json({ contact: updated, results });
});

// Enrich website only
router.post('/:id/website', async (req, res) => {
  const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id);
  if (!contact) return res.status(404).json({ error: 'Contact not found' });
  if (!contact.website) return res.status(400).json({ error: 'No website URL on contact' });

  try {
    let url = contact.website;
    if (!url.startsWith('http')) url = 'https://' + url;

    const response = await axios.get(url, {
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0 Chrome/120' },
      maxRedirects: 5,
    });

    const $ = cheerio.load(response.data);
    const title = $('meta[property="og:title"]').attr('content') || $('title').text().trim().slice(0, 200) || '';
    const description = ($('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '').slice(0, 500);

    db.prepare(`UPDATE contacts SET website_title=?, website_description=?, enriched_at=datetime('now'), updated_at=datetime('now') WHERE id=?`)
      .run(title, description, req.params.id);

    res.json({ success: true, title, description });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
