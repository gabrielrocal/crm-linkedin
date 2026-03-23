const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'crm.db'));

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create contacts table
db.exec(`
  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT DEFAULT '',
    type TEXT DEFAULT '',
    name TEXT NOT NULL DEFAULT '',
    industry TEXT DEFAULT '',
    linkedin_url TEXT DEFAULT '',
    website TEXT DEFAULT '',
    email_or_phone TEXT DEFAULT '',
    first_contact_date TEXT DEFAULT '',
    bump1 INTEGER DEFAULT 0,
    bump2 INTEGER DEFAULT 0,
    bump3 INTEGER DEFAULT 0,
    response INTEGER DEFAULT 0,
    loom_sent INTEGER DEFAULT 0,
    sales_call INTEGER DEFAULT 0,
    notes TEXT DEFAULT '',
    answer TEXT DEFAULT '',
    revenue REAL DEFAULT 0,
    linkedin_photo TEXT DEFAULT '',
    linkedin_headline TEXT DEFAULT '',
    linkedin_company TEXT DEFAULT '',
    linkedin_location TEXT DEFAULT '',
    website_title TEXT DEFAULT '',
    website_description TEXT DEFAULT '',
    website_favicon TEXT DEFAULT '',
    enriched_at TEXT DEFAULT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )
`);

module.exports = db;
