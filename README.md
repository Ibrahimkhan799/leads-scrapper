# LeadIntel

Generic **local business lead intelligence**. Type any category and city (gyms, dentists, restaurants, law firms, padel clubs — anything). The same pipeline discovers real businesses, finds websites and contacts, scores website-development prospects, and exports CSV.

This is a **completely free** local app by default. Discovery uses [OpenStreetMap](https://www.openstreetmap.org) and [Overpass](https://overpass-api.de). Website search uses DuckDuckGo HTML. No Google key, no credits, no paid account.

---

## What you need

| Tool | Why |
| --- | --- |
| **Node.js 20+** | Runs the app ([nodejs.org](https://nodejs.org)) |
| **Docker Desktop** *or* local Postgres | Database. Docker is the easy path (`docker compose up -d`). Redis is optional. |
| **Git** | Clone the repo |

You do **not** need:

- A Google Places / Maps API key
- OpenAI
- Redis (jobs run inside Next.js unless you turn that off)
- Playwright browsers

---

## First-time install (copy-paste)

```bash
git clone https://github.com/Ibrahimkhan799/leads-scrapper.git
cd leads-scrapper
npm run setup
npm run dev
```

Then open **[http://localhost:3000](http://localhost:3000)**.

`npm run setup` will:

1. Copy `.env.example` → `.env` (no keys to fill in)
2. Start Postgres + Redis with Docker
3. `npm install`
4. Create database tables
5. Seed demo leads so the dashboard is not empty

If Postgres is not already on port 5432, start Docker Desktop and run `npm run setup` again. You can also point `DATABASE_URL` at any local Postgres and re-run setup.

### Manual install (same result)

```bash
cp .env.example .env
docker compose up -d
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Leave `USE_MOCK_PROVIDERS=false` and `INLINE_JOBS=true`. Leave `GOOGLE_PLACES_API_KEY` empty.

---

## First use

Seeded rows on the dashboard are **demo data** so you can click around. Real outreach lists come from **Generate leads**.

1. Open [http://localhost:3000](http://localhost:3000) → **Generate leads**
2. Business type: `cafe` (or gym, dentist, restaurant, …)
3. Country / city: e.g. United Arab Emirates / Dubai
4. Number of leads: **10–20** the first time (enrichment crawls each public website)
5. Sources:
   - **OpenStreetMap (free)** — on
   - **Google Places (paid)** — off
   - **Web search for official sites (free)** — on
6. Click **Generate leads**
7. Stay on the job page until status is **COMPLETED** (often 1–3 minutes for 10–20 leads; OSM public servers can be slow)
8. Open **Leads**, sort by HOT / HIGH
9. Open a lead for contacts, socials, website audit, and score breakdown
10. Export CSV from the leads table (filtered or selected rows)

A **HOT** lead is usually a real local business with a missing or weak website — the default scoring target for website-development outreach.

### If a search returns few or zero businesses

- Try a more common category (`restaurant`, `cafe`, `dentist`, `gym`, `hotel`)
- Use a well-mapped city (Dubai, London, Berlin, NYC, …)
- Wait a minute and retry — Overpass public instances sometimes return 502; the app retries mirrors and falls back to Nominatim
- OSM has name, address, coordinates, and often phone/website/hours. It usually does **not** have Google-style ratings or review counts

---

## What is free vs optional paid

| Feature | Cost | Default |
| --- | --- | --- |
| OpenStreetMap / Overpass / Nominatim discovery | Free | On |
| DuckDuckGo HTML website search | Free | On |
| Cheerio website crawl + contact/social extract | Free | On |
| Lead scoring + CSV export | Free | On |
| Postgres + Redis via Docker | Free | On |
| Google Places | **Paid** (Google billing) | Off — leave key empty |
| OpenAI insights on HOT/HIGH leads | Paid if you set a key | Off |
| Playwright JS-heavy crawl | Free software, extra install | Off |

Be polite with OSM: the app already spaces Nominatim calls (~1.1s). Do not raise volume against public servers for huge nationwide scrapes.

---

## Daily commands

| Command | Purpose |
| --- | --- |
| `npm run setup` | First-time (or reset) install |
| `npm run dev` | Web app at localhost:3000 (inline jobs) |
| `npm run db:seed` | Reload demo leads (**wipes businesses**) |
| `npm run db:studio` | Prisma Studio (inspect the database) |
| `npm test` | Vitest |
| `npm run typecheck` | TypeScript |
| `npm run lint` | ESLint |
| `docker compose down` | Stop Postgres/Redis |
| `docker compose up -d` | Start Postgres/Redis again |

Background workers (optional): set `INLINE_JOBS=false` in `.env`, then `npm run dev:all` (web + Redis worker) or `npm run worker` in a second terminal.

---

## Workflow (after install)

1. **Generate leads** — category, country, city, keywords, max leads
2. Pipeline: discover → dedupe → find official site → crawl public pages → extract contacts/socials → audit site → score
3. Review HOT / HIGH in **Leads** or a lead detail page
4. Update CRM status, tags, notes, follow-up
5. Export CSV

Business type is an input, not a hardcoded industry scraper.

---

## Troubleshooting

**`npm run setup` fails on Docker**  
Start Docker Desktop. Confirm `docker compose version` works. Port 5432 must be free (`lsof -i :5432`).

**Jobs stay QUEUED forever**  
Default `INLINE_JOBS=true` runs jobs in the web process. If you set `INLINE_JOBS=false`, you must run `npm run worker` or `npm run dev:all` with Redis up. If Redis is down, the app falls back to inline jobs automatically.

**OpenStreetMap 502 / timeout**  
Normal on public Overpass. The app retries other mirrors, then Nominatim. Retry the job.

**Dashboard looks fake**  
That is seed data. Use **Generate leads** for live OSM results.

**Want Google ratings**  
That requires a billed Google Places key. This project is designed to work without it.

**Node version**  
Need 20+. `node -v`.

---

## Stack

Next.js 16 (App Router), TypeScript, Tailwind, React 19, PostgreSQL + Prisma, optional Redis + BullMQ, Cheerio crawler, Zod, Vitest.

Add another discovery source by implementing `BusinessDiscoveryProvider`.

## Security

Crawling is limited to public HTTP(S) URLs. SSRF protection blocks localhost, private networks, link-local, and cloud metadata hosts. CAPTCHA, login, paywall, and anti-bot bypasses are intentionally not implemented. Blocked sites are recorded as `BLOCKED` and the job continues.
