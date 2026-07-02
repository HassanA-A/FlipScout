# FlipScout

AI-powered deal scouting for local PC flippers. One board to capture, value,
and track deals from Facebook Marketplace, OfferUp, Craigslist, eBay, and more
— without depending on scraping.

**Read [DESIGN.md](./DESIGN.md) first** — architecture decisions, database
schema, API design, AI pipeline, roadmap, and the business case.

## What's in this prototype

- **Deal board** — 8-stage kanban (New → Sold/Passed), drag-and-drop, deal
  modal with analysis, notes, and purchase/sale actuals.
- **Analyzer** — paste listing text + price → deterministic alias engine
  extracts components and values them from the price database. The LLM (M2)
  will only ever extract; it never sets prices.
- **Watchlists** — rules like "RTX 3060 under $180" with live match counts.
- **Price database** — editable component values that drive every valuation.
- **Analytics** — invested, ROI, realized profit, best flips, from actuals.
- **Chrome extension skeleton** (`extension/`) — user-initiated capture of the
  listing you're viewing → `POST /api/ingest` → analyzed and on your board.

Persistence is a JSON file (`data/db.json`, seeded with demo deals on first
run). `lib/store.ts` is the only module that knows this — milestone M1 swaps
it for Supabase Postgres without touching the UI.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. To reset the demo data, delete `data/db.json`.

### Try the analyzer

Paste something like this on the Analyze page with an asking price of $420:

> Custom gaming PC. Ryzen 5 5600X, RTX 3060 12GB, 16GB DDR4 3200, 1TB NVMe,
> 650W gold PSU, B550 board, NZXT H510 case.

### Load the extension

1. `chrome://extensions` → Developer mode → Load unpacked → `extension/`
2. Open any marketplace listing, click the FlipScout icon → **Analyze with
   FlipScout**. Requires the dev server running.

## Stack

Next.js (App Router) · React · TypeScript · Tailwind v4 — a deliberate
monolith; see DESIGN.md §1.1 for why there's no separate FastAPI service yet.
