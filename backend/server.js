require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const db = require('./db');
const contactsRouter = require('./routes/contacts');
const enrichRouter = require('./routes/enrich');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/contacts', contactsRouter);
app.use('/api/enrich', enrichRouter);

// CSV Import
const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/import/csv', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const content = req.file.buffer.toString('utf-8');
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    });

    const toBool = (v) => {
      if (!v) return 0;
      const s = String(v).toLowerCase().trim();
      return (s === 'y' || s === 'yes' || s === 'true' || s === '1') ? 1 : 0;
    };

    // Column name aliases (handle different header names)
    const get = (row, ...keys) => {
      for (const k of keys) {
        const found = Object.keys(row).find(rk => rk.toLowerCase().includes(k.toLowerCase()));
        if (found && row[found] !== undefined) return row[found];
      }
      return '';
    };

    const stmt = db.prepare(`
      INSERT INTO contacts (
        source, type, name, industry, linkedin_url, website, email_or_phone,
        first_contact_date, bump1, bump2, bump3, response, loom_sent, sales_call,
        notes, answer, revenue
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let imported = 0;
    let skipped = 0;

    for (const row of records) {
      const name = get(row, 'name', 'first');
      if (!name.trim()) { skipped++; continue; }

      stmt.run(
        get(row, 'source'),
        get(row, 'type'),
        name,
        get(row, 'industry'),
        get(row, 'social', 'linkedin'),
        get(row, 'website'),
        get(row, 'email', 'phone'),
        get(row, 'first contact', 'date'),
        toBool(get(row, 'gentle', 'bump1', '1 ')),
        toBool(get(row, 'value', 'nudge', 'bump2')),
        toBool(get(row, 'last shot', 'bump3', '4-5')),
        toBool(get(row, 'response')),
        toBool(get(row, 'loom')),
        toBool(get(row, 'sales call', 'call')),
        get(row, 'notes', 'message'),
        get(row, 'answer'),
        parseFloat(get(row, 'revenue')) || 0,
      );
      imported++;
    }

    res.json({ imported, skipped, total: records.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stats endpoint
app.get('/api/stats', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as count FROM contacts').get().count;
  const responded = db.prepare('SELECT COUNT(*) as count FROM contacts WHERE response=1').get().count;
  const loomSent = db.prepare('SELECT COUNT(*) as count FROM contacts WHERE loom_sent=1').get().count;
  const salesCalls = db.prepare('SELECT COUNT(*) as count FROM contacts WHERE sales_call=1').get().count;
  const revenue = db.prepare('SELECT COALESCE(SUM(revenue),0) as total FROM contacts').get().total;
  const proxycurlEnabled = !!(process.env.PROXYCURL_API_KEY && process.env.PROXYCURL_API_KEY !== 'your_proxycurl_api_key_here');

  res.json({ total, responded, loomSent, salesCalls, revenue, proxycurlEnabled });
});

app.listen(PORT, () => {
  console.log(`\n  CRM backend running at http://localhost:${PORT}`);
  console.log(`  LinkedIn enrichment: ${process.env.PROXYCURL_API_KEY ? 'ENABLED' : 'DISABLED (add PROXYCURL_API_KEY to .env)'}\n`);
});
