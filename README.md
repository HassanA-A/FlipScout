# FlipScout

AI-powered deal scouting for local PC flippers.

One board to capture, value, and track deals from Facebook Marketplace, OfferUp, Craigslist, eBay, and more — without scraping.

## Quick start

**See [SETUP.md](./SETUP.md) for step-by-step instructions.**

TL;DR:
```bash
npm install
cp .env.example .env.local
# Add your Supabase credentials to .env.local
npm run dev
```

Open http://localhost:3000 and load the Firefox extension from `extension/`.

## What's inside

- **Deal board** — 8-stage kanban with drag-and-drop and analysis breakdown
- **Analyzer** — deterministic alias engine + LLM extraction fallback (M2)
- **Watchlists** — rules with live match counts
- **Price database** — editable component values
- **Analytics** — ROI, invested, best flips
- **Firefox extension** — user-initiated capture from any marketplace

Stack: Next.js · TypeScript · Tailwind · Supabase Postgres

## Architecture

See [DESIGN.md](./DESIGN.md) for the full CTO-level design: database schema, API contract, AI pipeline, roadmap, business assessment.

## Status

Prototype: ✅ Core board + analyzer + watchlists  
Firefox extension: ✅ User-initiated capture  
Supabase + Vercel: ✅ Deployed  
LLM extraction: 🔜 Milestone M2  
Discord/Telegram alerts: 🔜 Milestone M4  
eBay/Reddit polling: 🔜 Milestone M5
