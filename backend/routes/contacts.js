const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all contacts with optional search/filter
router.get('/', (req, res) => {
  const { search, source, type, industry } = req.query;
  let query = 'SELECT * FROM contacts WHERE 1=1';
  const params = [];

  if (search) {
    query += ' AND (name LIKE ? OR email_or_phone LIKE ? OR industry LIKE ? OR linkedin_headline LIKE ? OR linkedin_company LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s, s, s);
  }
  if (source) {
    query += ' AND source = ?';
    params.push(source);
  }
  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }
  if (industry) {
    query += ' AND industry LIKE ?';
    params.push(`%${industry}%`);
  }

  query += ' ORDER BY created_at DESC';

  try {
    const contacts = db.prepare(query).all(...params);
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single contact
router.get('/:id', (req, res) => {
  try {
    const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id);
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    res.json(contact);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create contact
router.post('/', (req, res) => {
  const {
    source = '', type = '', name = '', industry = '',
    linkedin_url = '', website = '', email_or_phone = '',
    first_contact_date = '', bump1 = 0, bump2 = 0, bump3 = 0,
    response = 0, loom_sent = 0, sales_call = 0,
    notes = '', answer = '', revenue = 0,
  } = req.body;

  if (!name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO contacts (
        source, type, name, industry, linkedin_url, website, email_or_phone,
        first_contact_date, bump1, bump2, bump3, response, loom_sent, sales_call,
        notes, answer, revenue
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      source, type, name, industry, linkedin_url, website, email_or_phone,
      first_contact_date, bump1 ? 1 : 0, bump2 ? 1 : 0, bump3 ? 1 : 0,
      response ? 1 : 0, loom_sent ? 1 : 0, sales_call ? 1 : 0,
      notes, answer, parseFloat(revenue) || 0
    );
    const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(contact);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update contact
router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Contact not found' });

  const fields = {
    source: req.body.source ?? existing.source,
    type: req.body.type ?? existing.type,
    name: req.body.name ?? existing.name,
    industry: req.body.industry ?? existing.industry,
    linkedin_url: req.body.linkedin_url ?? existing.linkedin_url,
    website: req.body.website ?? existing.website,
    email_or_phone: req.body.email_or_phone ?? existing.email_or_phone,
    first_contact_date: req.body.first_contact_date ?? existing.first_contact_date,
    bump1: req.body.bump1 !== undefined ? (req.body.bump1 ? 1 : 0) : existing.bump1,
    bump2: req.body.bump2 !== undefined ? (req.body.bump2 ? 1 : 0) : existing.bump2,
    bump3: req.body.bump3 !== undefined ? (req.body.bump3 ? 1 : 0) : existing.bump3,
    response: req.body.response !== undefined ? (req.body.response ? 1 : 0) : existing.response,
    loom_sent: req.body.loom_sent !== undefined ? (req.body.loom_sent ? 1 : 0) : existing.loom_sent,
    sales_call: req.body.sales_call !== undefined ? (req.body.sales_call ? 1 : 0) : existing.sales_call,
    notes: req.body.notes ?? existing.notes,
    answer: req.body.answer ?? existing.answer,
    revenue: req.body.revenue !== undefined ? (parseFloat(req.body.revenue) || 0) : existing.revenue,
    linkedin_photo: req.body.linkedin_photo ?? existing.linkedin_photo,
    linkedin_headline: req.body.linkedin_headline ?? existing.linkedin_headline,
    linkedin_company: req.body.linkedin_company ?? existing.linkedin_company,
    linkedin_location: req.body.linkedin_location ?? existing.linkedin_location,
    website_title: req.body.website_title ?? existing.website_title,
    website_description: req.body.website_description ?? existing.website_description,
    website_favicon: req.body.website_favicon ?? existing.website_favicon,
    enriched_at: req.body.enriched_at ?? existing.enriched_at,
  };

  try {
    db.prepare(`
      UPDATE contacts SET
        source=?, type=?, name=?, industry=?, linkedin_url=?, website=?,
        email_or_phone=?, first_contact_date=?, bump1=?, bump2=?, bump3=?,
        response=?, loom_sent=?, sales_call=?, notes=?, answer=?, revenue=?,
        linkedin_photo=?, linkedin_headline=?, linkedin_company=?, linkedin_location=?,
        website_title=?, website_description=?, website_favicon=?, enriched_at=?,
        updated_at=datetime('now')
      WHERE id=?
    `).run(
      fields.source, fields.type, fields.name, fields.industry,
      fields.linkedin_url, fields.website, fields.email_or_phone,
      fields.first_contact_date, fields.bump1, fields.bump2, fields.bump3,
      fields.response, fields.loom_sent, fields.sales_call,
      fields.notes, fields.answer, fields.revenue,
      fields.linkedin_photo, fields.linkedin_headline, fields.linkedin_company, fields.linkedin_location,
      fields.website_title, fields.website_description, fields.website_favicon, fields.enriched_at,
      req.params.id
    );
    const updated = db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE contact
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM contacts WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Contact not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
