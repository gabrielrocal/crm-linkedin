# CLAUDE.md — Project Knowledge Base

## What this project is

A personal CRM (Contact Relationship Manager) built to replace a Google Sheets spreadsheet. It tracks sales outreach contacts through a multi-step follow-up pipeline, and auto-enriches each contact's card with data pulled from their LinkedIn profile and company website.

The original spreadsheet (Google Sheets) had 17 columns and served as the source of truth for the contact schema and field names.

---

## Two versions of the app

This repo contains two separate implementations that share the same concept and design:

### 1. `crm.html` — The primary version (preferred)
A **single self-contained HTML file**. Double-click to open in any browser. No installation, no server, no Node.js required. This is the version the user actually uses day-to-day.

- Built with: React 18 (via unpkg CDN) + Babel standalone (for JSX in browser) + Tailwind CSS (via CDN)
- Data storage: **browser localStorage** (`crm_contacts` key, `crm_proxycurl_key` for settings)
- LinkedIn enrichment: direct fetch to Proxycurl API from the browser
- Website enrichment: uses `api.allorigins.win` as a CORS proxy, parses meta tags with regex
- Settings (API key) stored in localStorage under `crm_proxycurl_key`
- No backend, no database file, no install step

### 2. `backend/` + `frontend/` — The full-stack version (for deployment)
A Node.js + React app meant for hosting (e.g. Railway). Not currently in active use.

- Backend: Node.js / Express / SQLite (`better-sqlite3`) — database at `backend/data/crm.db`
- Frontend: React 18 / Vite / Tailwind CSS / Lucide React icons
- In production, Express serves the built React frontend as static files
- LinkedIn enrichment: Proxycurl API called server-side (env var `PROXYCURL_API_KEY`)
- Website enrichment: Cheerio scraping via `axios` on the server
- Deployed via Railway (`railway.json` config at root)

---

## Folder structure

```
crm-linkedin/
│
├── crm.html                  ← THE MAIN APP. Single file, open in browser directly.
├── import_contacts.html      ← One-click importer: embeds CSV data, seeds localStorage, redirects to crm.html
│
├── backend/
│   ├── server.js             ← Express server: API routes, CSV import, static file serving
│   ├── db.js                 ← SQLite setup, creates contacts table on first run
│   ├── data/                 ← SQLite database lives here (gitignored)
│   │   └── crm.db
│   ├── routes/
│   │   ├── contacts.js       ← CRUD: GET/POST/PUT/DELETE /api/contacts
│   │   └── enrich.js         ← POST /api/enrich/:id (LinkedIn + website enrichment)
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx           ← Main layout, state, data fetching
│   │   ├── index.css         ← Tailwind base imports + line-clamp utilities
│   │   ├── main.jsx          ← React root render
│   │   └── components/
│   │       ├── ContactCard.jsx   ← Individual contact card (photo, pipeline, badges)
│   │       ├── ContactModal.jsx  ← Add / edit contact form (modal overlay)
│   │       ├── Header.jsx        ← Top gradient bar
│   │       └── StatsBar.jsx      ← 5-tile stats row + Proxycurl warning
│   ├── index.html
│   ├── vite.config.js        ← Dev server proxy: /api → localhost:3001
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
│
├── package.json              ← Root: `npm run setup`, `npm run dev`, `npm start`
├── railway.json              ← Railway deployment config (build + start commands)
├── .env.example              ← Template for PORT and PROXYCURL_API_KEY
├── .gitignore
└── README.md
```

---

## Contact data schema

Every contact has these fields (stored as JSON in localStorage):

| Field | Type | Description |
|---|---|---|
| `source` | string | How they were found: Phone, WhatsApp, Email, LinkedIn, Instagram |
| `type` | string | Contact category: Leak, Faucet, Cold. **Default: Cold** |
| `name` | string | Full name (required) |
| `industry` | string | Their industry or business type. **Default: Architecture** |
| `linkedin_url` | string | Full LinkedIn profile URL |
| `website` | string | Company website URL |
| `email_or_phone` | string | Primary contact method |
| `first_contact_date` | date | Date of first outreach (YYYY-MM-DD for inputs, but may be stored as DD/MM/YY from imports) |
| `bump1` | boolean | "Gentle Bump" follow-up done |
| `bump1_date` | date | Date bump 1 was sent |
| `bump2` | boolean | "Value Nudge" follow-up done |
| `bump2_date` | date | Date bump 2 was sent |
| `bump3` | boolean | "Last Shot" follow-up done |
| `bump3_date` | date | Date last shot was sent |
| `response` | boolean | Did they respond? |
| `loom_sent` | boolean | Was a Loom video sent? |
| `sales_call` | boolean | Was a sales call completed? |
| `notes` | text | Labelled "Info" in the UI — message sent or context notes |
| `answer` | text | Their response/feedback |
| `revenue` | number | Deal value in USD |
| `status` | string | Pipeline status (see Status field below) |
| `linkedin_photo` | string | Profile photo URL (auto-enriched) |
| `linkedin_headline` | string | LinkedIn headline (auto-enriched) |
| `linkedin_company` | string | Current company from LinkedIn (auto-enriched) |
| `linkedin_location` | string | City + country from LinkedIn (auto-enriched) |
| `website_title` | string | Page title from company website (auto-enriched) |
| `website_description` | string | Meta description from website (auto-enriched) |
| `enriched_at` | datetime | Last enrichment timestamp |

In the full-stack SQLite version, booleans are stored as INTEGER (0/1). In `crm.html` they are stored as native JS booleans in JSON.

---

## Pipeline stages (in order)

The pipeline bar on each card shows **4 steps** (indigo when done, gray when not):

1. **1st** — `first_contact_date` (truthy = done)
2. **Bump 1** — `bump1`
3. **Bump 2** — `bump2`
4. **Last Shot** — `bump3`

`response`, `loom_sent`, and `sales_call` are **not** in the pipeline bar. They appear as separate circle checkmarks below the bar on each card (gray = not done, green ✓ = done).

---

## Status field

Every contact has a `status` field with 5 possible values:

| Value | Color | Meaning |
|---|---|---|
| `not started` | gray | No outreach done yet |
| `to follow up` | amber | 1st contact made, awaiting reply |
| `ongoing` | blue | They responded |
| `closed` | emerald | Deal closed |
| `discarded` | red | No longer pursuing |

**Auto-logic** (applied when saving, unless status is `closed` or `discarded`):
- If `response` is true → status becomes `ongoing`
- Else if `first_contact_date` is set → status becomes `to follow up`
- Else → status becomes `not started`

`closed` and `discarded` are never auto-overridden — they must be set manually.

**Hide Discarded toggle**: The toolbar has a toggle (defaults to ON) that hides `discarded` contacts from the main view. When a status filter is explicitly set to "Discarded", they are shown regardless.

---

## Design system

### Font
- **Inter** (Google Fonts) — weights 400, 500, 600, 700
- Fallback: `system-ui, sans-serif`

### Colors
| Role | Value |
|---|---|
| Background | `#f8fafc` (Tailwind `gray-50`) |
| Cards | `white` |
| Primary / CTA | `indigo-600` (#4f46e5) |
| Primary hover | `indigo-700` |
| Focus ring | `indigo-400` |
| Header gradient | `from-indigo-700 to-indigo-500` (left → right) |
| Pipeline filled | `indigo-500` |
| Pipeline empty | `gray-100` / `gray-200` |

### Source badge colors
| Source | Color |
|---|---|
| LinkedIn | `bg-blue-100 text-blue-700` |
| Email | `bg-purple-100 text-purple-700` |
| Phone | `bg-green-100 text-green-700` |
| WhatsApp | `bg-emerald-100 text-emerald-700` |
| Instagram | `bg-pink-100 text-pink-700` |

### Type badge colors
| Type | Color |
|---|---|
| Leak | `bg-cyan-100 text-cyan-700` |
| Faucet | `bg-teal-100 text-teal-700` |
| Cold | `bg-gray-100 text-gray-600` |

### Status badge colors
| Status | Color |
|---|---|
| not started | `bg-gray-100 text-gray-500` |
| to follow up | `bg-amber-100 text-amber-700` |
| ongoing | `bg-blue-100 text-blue-700` |
| closed | `bg-emerald-100 text-emerald-700` |
| discarded | `bg-red-100 text-red-400` |

### Avatar colors (when no LinkedIn photo)
10 Tailwind 500-weight colors used deterministically based on a hash of the contact's name, so the same person always gets the same color. Colors: indigo, purple, pink, rose, orange, amber, emerald, teal, cyan, blue.

### Card shape
- `rounded-2xl`, `shadow-sm`, `hover:shadow-md` with smooth transition
- `border border-gray-100`
- Internal sections separated by `border-t border-gray-50`
- Clicking anywhere on the card (except links and the ⋯ menu) opens the Edit modal

### Modals
- Backdrop: `rgba(0,0,0,0.45)` + `backdrop-filter: blur(4px)`
- Modal container: `rounded-2xl`, `max-w-2xl`, scrollable body
- Header: same indigo gradient as main header
- Footer: `bg-gray-50` with Cancel + primary action buttons
- **Esc** saves the form (if name is filled) or closes (if name is empty)
- **Click outside** (on the dark backdrop) also saves/closes the same way
- **✕ button** (top-right) and **Cancel** button close without saving

---

## UI sections / layout

### Header
Indigo gradient bar. Contains the LinkedIn SVG logo icon in a frosted square, the app title "CRM LinkedIn", subtitle showing contact count, and a ⚙ settings button on the right.

### StatsBar
5 clickable tiles in a row:
- **Total** (indigo) — clicking clears all filters
- **To Follow Up** (amber) — clicking filters by status = `to follow up`
- **Ongoing** (blue) — clicking filters by status = `ongoing`
- **Closed** (emerald) — clicking filters by status = `closed`
- **Revenue** (violet) — display only, not clickable

Active tile gets an indigo ring. Replaces the previous Responded / Loom Sent / Sales Calls tiles.

### Toolbar
Single row (wraps on small screens):
- Search input (full-text across name, email, industry, headline, company)
- Source filter dropdown
- Type filter dropdown
- Status filter dropdown (All Status / Not Started / To Follow Up / Ongoing / Closed / Discarded)
- Pipeline stage filter dropdown (All Stages / Pending 1st Contact / Pending Bump 1 / Pending Bump 2 / Pending Last Shot / All Bumps Done)
- **✕ clear button** — always visible; faded + non-clickable when no filters active
- **🚫/👁 Discarded toggle** — hides/shows discarded contacts (defaults to hidden)
- Import CSV button (file input)
- Export CSV button
- **Add Contact** button (indigo, right-aligned)

### Card grid
Responsive: 1 column → 2 columns (md) → 3 columns (xl). Gap of 5 units (`gap-5`). Max width `7xl` with horizontal padding.

### ContactCard
- Top section: avatar, name (turns indigo on hover), headline, company·industry, location, links (LinkedIn, website, email/phone)
- Pipeline bar: 4-step indigo/gray bar (1st, Bump 1, Bump 2, Last Shot)
- Circle checkmarks row: Response, Loom, Sales Call (gray = no, green ✓ = yes)
- Optional: Info/notes preview (italic, 2-line clamp)
- Footer: source badge, type badge, status badge, enriched date (tiny gray), revenue badge (emerald)
- Action menu (⋯): Edit, Enrich (✨), Delete — appears on click, closes on outside click
- **Clicking the card body opens Edit modal directly**

### ContactModal (Add/Edit)
4 sections separated by gray section headers:
1. **Basic Info**: Name (required), Industry (default: Architecture), Source (dropdown), Type (dropdown, default: Cold), Status (dropdown)
2. **Contact Details**: LinkedIn URL + ↗ open button, Website + ↗ open button, Email or Phone
3. **Pipeline**:
   - 1st Contact row: dot indicator + date input
   - Bump 1 message suggestions (amber box, appears when 1st contact date is set — 4 one-click copy messages)
   - Bump 1 row: dot + toggle + date input (auto-fills today when toggled on)
   - Bump 2 row: dot + toggle + date input
   - Last Shot row: dot + toggle + date input
   - Response / Loom Sent / Sales Call: 3 clickable tile cards (green when done)
4. **Notes & Revenue**: Info textarea (labelled "Info", stores in `notes` field), Answer textarea, Revenue number input

Footer buttons:
- **Cancel** (closes without saving)
- **Add & New** (new contacts only) — saves and reopens a fresh blank form
- **Add Contact / Save Changes** (primary action)

### SettingsModal (`crm.html` only)
Simple modal with Proxycurl API key input + info text + a note that all data is stored locally.

---

## Bump 1 message suggestions

When `first_contact_date` is set, the edit modal shows 4 pre-written Bump 1 messages in an amber box. Clicking any of them copies the text to clipboard (button turns green with "✓ Copied!" for 1.8s).

The 4 messages:
1. *Just bumping this up — worth a quick look?*
2. *Circling back in case this got buried. Quick look?*
3. *Bumping this to the top. Worth 2 minutes?*
4. *Just following up — wanted to make sure this didn't get lost.*

---

## Enrichment system

### LinkedIn (Proxycurl)
- API: `GET https://nubela.co/proxycurl/api/v2/linkedin?url=...&use_cache=if-present`
- Auth: `Authorization: Bearer {key}`
- Fills: `linkedin_photo`, `linkedin_headline`, `linkedin_company` (from current experience), `linkedin_location` (city + country)
- Free tier: 10 credits at nubela.co/proxycurl

### Website
- In `crm.html`: uses `https://api.allorigins.win/get?url=...` as CORS proxy, parses `og:title`, `og:description`, `<title>`, `<meta name="description">` with regex
- In backend: uses `axios` + `cheerio` to scrape directly server-side
- Fills: `website_title` (max 150 chars), `website_description` (max 400/500 chars)

Enrichment is **manual** — triggered by clicking ✨ Enrich on the card's action menu. It runs both LinkedIn and website enrichment in sequence and shows a toast with results.

---

## CSV import/export

**Import**: Accepts a `.csv` file. Column matching is fuzzy (case-insensitive substring match), so it works with the original Google Sheets export. Boolean fields accept Y/Yes/TRUE/1/date-strings (any non-empty, non-false value). Rows with no name are skipped. Status is auto-computed from pipeline fields on import.

**Export** (`crm.html` only): Downloads a `.csv` with all contacts including pipeline status, bump dates, and status as columns.

**`import_contacts.html`**: A one-time importer with all contacts embedded directly as CSV. Open it in a browser, it parses the CSV, seeds localStorage, and redirects to `crm.html`. Has a safety check that skips import if contacts already exist.

Google Sheets export path: File → Download → Comma Separated Values (.csv)

---

## Environment & infrastructure

- **OS**: Windows 11 (Spanish locale)
- **GitHub**: `github.com/gabrielrocal/crm-linkedin` (public repo, user: `gabrielrocal`)
- **Local path**: `C:\Users\gabri\crm-linkedin`
- **Node.js**: NOT installed on the machine — the user relies on `crm.html` which requires no installation
- **Git**: Installed and configured with GitHub credentials stored via credential manager

### Running the full-stack version (requires Node.js)
```
npm run setup    # installs all dependencies
npm run dev      # starts backend (port 3001) + frontend (port 5173) concurrently
```

### Deploying to Railway
- Config: `railway.json` at root
- Build command: `npm install && npm run build`
- Start command: `node backend/server.js`
- Set env var `PROXYCURL_API_KEY` in Railway dashboard

---

## User preferences

- Does not code and does not want to learn — everything must be done by Claude
- Wants minimal permission prompts; prefers Claude to just do things
- The primary deliverable is always `crm.html` (single file, no setup)
- The full-stack version exists as a deployment option but is secondary
- Original data source is a Google Sheets spreadsheet with 17 columns tracking sales outreach
- Target industry is **Architecture** (ghostwriting / email marketing for architecture offices)
