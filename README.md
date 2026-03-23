# CRM LinkedIn

A contact relationship manager with automatic LinkedIn & website enrichment. Shows a card for every contact with their profile photo, headline, company, and pipeline status.

## Features

- **Contact Cards** – visual cards with photo, headline, company, location
- **LinkedIn Enrichment** – auto-fills profile photo, headline, company from LinkedIn (requires Proxycurl API key)
- **Website Enrichment** – auto-fills title & description from company website
- **Pipeline Tracker** – visual progress bar (1st Contact → Bump 1 → Bump 2 → Last Shot → Response → Loom → Sales Call)
- **CSV Import** – import your existing spreadsheet contacts
- **Search & Filter** – filter by source, type, or search by name
- **Stats Dashboard** – total contacts, responses, loom sent, sales calls, pipeline revenue

## Setup

### 1. Prerequisites
- [Node.js](https://nodejs.org) v18 or newer

### 2. Install dependencies
```bash
npm run setup
```

### 3. Configure environment
```bash
cp .env.example .env
```

Edit `.env` with your settings:
```
PORT=3001
PROXYCURL_API_KEY=your_key_here
```

> **Get a Proxycurl API key** (for LinkedIn enrichment):
> 1. Go to [nubela.co/proxycurl](https://nubela.co/proxycurl)
> 2. Sign up for a free account (10 free credits)
> 3. Copy your API key into `.env`
>
> LinkedIn enrichment works without a key, but no profile data will be fetched.

### 4. Run the app
```bash
npm run dev
```

Open **http://localhost:5173** in your browser.

## Import from Spreadsheet

1. Open your Google Sheet → File → Download → CSV
2. Click **Import CSV** in the top toolbar
3. Select the downloaded file

The importer will automatically map the columns from your CRM spreadsheet.

## Usage

### Adding a contact
1. Click **Add Contact**
2. Fill in name, LinkedIn URL, website, and pipeline status
3. Click **Add Contact** to save
4. Click **⋯ → Enrich** on the card to auto-fill LinkedIn & website data

### Enriching contacts
Click the **⋯** menu on any card and select **Enrich** to:
- Fetch the LinkedIn profile photo, headline, company, and location
- Fetch the website title and description

### Pipeline tracking
Check off stages in the Edit modal as your outreach progresses:
1st Contact → Gentle Bump → Value Nudge → Last Shot → Response → Loom Sent → Sales Call

## Database

Contacts are stored in `backend/data/crm.db` (SQLite). To back up your data, just copy that file.

## Project Structure

```
crm-linkedin/
├── backend/          Node.js + Express API
│   ├── server.js
│   ├── db.js         SQLite database setup
│   └── routes/
│       ├── contacts.js   CRUD operations
│       └── enrich.js     LinkedIn & website enrichment
└── frontend/         React + Vite + Tailwind CSS
    └── src/
        ├── App.jsx
        └── components/
            ├── ContactCard.jsx
            ├── ContactModal.jsx
            ├── Header.jsx
            └── StatsBar.jsx
```
