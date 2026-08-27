# LeadIntel

Generic **local business lead intelligence** platform. Enter any business category and location — gyms, dentists, restaurants, law firms, padel clubs, or something the database has never seen — and the same pipeline discovers, enriches, scores, and exports website-development prospects.

This is not an industry scraper. Business type is an input, not a schema.

## Stack

- Next.js 16, TypeScript, Tailwind CSS, React 19
- PostgreSQL + Prisma
- Redis + BullMQ
- Cheerio crawler (Playwright optional)
- Zod validation, Vitest

## Quick start

```bash
cp .env.example .env
docker compose up -d   # or use local Postgres + Redis
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

`USE_MOCK_PROVIDERS=false` (default) discovers **real businesses from OpenStreetMap**. That is free public map data and does not need a Google key.

Google Places is optional and paid. Leave it unset.

## Workflow

1. **Generate leads** — business type, country, city, keywords, max leads, discovery/enrichment options
2. A background job discovers businesses, deduplicates them, crawls public websites, extracts contacts/socials, audits the site, and scores the lead
3. Review HOT / HIGH leads in the table or detail page
4. Export filtered or selected rows as CSV

## Providers

Discovery is provider-agnostic:

- **OpenStreetMap / Overpass** (default, free, no API key)
- Mock (`USE_MOCK_PROVIDERS=true`)
- Google Places (`GOOGLE_PLACES_API_KEY`, paid)
- DuckDuckGo HTML search for official websites (free)
- HTTP search API (`SEARCH_API_URL` + `SEARCH_API_KEY`)
- Website crawler (Cheerio, Playwright if `PLAYWRIGHT_ENABLED=true`)
- AI (optional OpenAI; mock fallback)

OpenStreetMap coverage varies by city. Listings include name, coordinates, and often phone/website/hours. Google-style ratings and review counts are usually not in OSM.

Add another discovery source by implementing `BusinessDiscoveryProvider`.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Next.js + worker |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest |
| `npm run db:seed` | 70+ realistic businesses across categories and countries |
| `npm run worker` | BullMQ workers only |

## Security

Crawling is limited to public HTTP(S) URLs. SSRF protection blocks localhost, private networks, link-local, and cloud metadata hosts. CAPTCHA, login, paywall, and anti-bot bypasses are intentionally not implemented. Blocked sites are recorded as `BLOCKED` and the job continues.
