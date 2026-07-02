# FlipScout — Technical Design & Product Strategy

*CTO-level design document. Covers architecture decisions, database, API, AI pipeline, browser extension, UI, roadmap, and an honest business assessment.*

---

## 0. Executive summary

FlipScout is a deal-scouting cockpit for local PC flippers: one dashboard that ingests listings (via browser extension, paste, screenshot, and legitimate APIs), values them against a curated price database, scores the flip, and pushes alerts when watchlist rules match.

The single most important architectural decision in this document: **the LLM never sets prices.** The LLM extracts and normalizes ("this listing contains an RTX 2060, a 5600X, 16GB DDR4"). A deterministic price database does the valuation. An LLM that hallucinates a GPU price costs you real money at a seller's doorstep. Extraction is a language problem; valuation is a data problem. Keep them separate and the whole product gets more trustworthy, cheaper, and testable.

---

## 1. CTO challenges — where your plan is wrong (or right)

### 1.1 Drop FastAPI for the MVP ❌

You proposed Next.js frontend + FastAPI backend. For a solo founder this is the classic mistake: two codebases, two deploys, two type systems, CORS, duplicated validation, and a serialization boundary — all before you have one user.

**Decision: single Next.js monolith.** Route handlers are your API. One deploy on Vercel. You extract a Python service *later* only when you have a workload that justifies it (heavy ML, a scraping fleet, long-running jobs). The API surface designed in §4 is transport-agnostic — if you extract FastAPI later, the contract survives.

### 1.2 Skip Clerk at MVP ❌

You're already committed to Supabase, which ships auth for free. Adding Clerk means a second vendor, webhook syncing between Clerk users and your Postgres rows, and monthly cost — for an app with **one user (you)** for the first several months. Ship single-user with an env-var access token, add Supabase Auth when you onboard user #2. Clerk is a fine choice *later* if you want orgs/teams.

### 1.3 Your scraping instinct is correct ✅ — here's the actual ingestion hierarchy

You already know FB scraping is a trap. Formalize it as three tiers:

| Tier | Method | Sources | Reliability |
|------|--------|---------|-------------|
| **1 — Official/legit automated** | eBay Browse API (official, free tier), Reddit JSON API (r/hardwareswap) | eBay, Reddit | High — build automation here |
| **2 — User-initiated capture** | Chrome extension reads the DOM of the page *you* are viewing | Facebook, OfferUp, Craigslist, Mercari, Jawa | High — you're a user with a browser, not a bot farm |
| **3 — Manual** | Paste URL/text, upload screenshot | Everything | Perfect — always works |

Tier 2 is the product's soul. You'll still browse Marketplace (nothing replaces FB's inventory), but every listing becomes one click away from being analyzed, valued, and tracked. The extension never crawls, never runs headless, never touches pages you didn't open — that's the ToS-defensible line.

**Tier 1 is your watchlist engine.** eBay + Reddit hardwareswap can be polled automatically and legitimately. Watchlist alerts ("RTX 3060 under $180") fire from these sources on day one, with zero scraping risk. FB/OfferUp matches happen at capture time via the extension.

### 1.4 Redis "later" ✅ — correct

Postgres does everything at this scale: `pg_cron`/Vercel cron for polling, a `jobs` table for queues, `SELECT ... FOR UPDATE SKIP LOCKED` if you ever need real work-stealing. Add Redis when you measure a problem, not before.

### 1.5 One warning about the price database

"Improves over time" needs a mechanism, not a hope. Three feedback loops, in order of trust:
1. **Your own sales** — when you mark a deal Sold, the sale price is a verified market data point. Highest signal.
2. **eBay sold comps** — pollable via API; noisy (shipping, condition) but abundant.
3. **Asking prices you capture** — weakest signal (asks ≠ sales), but useful for local market temperature.

Every price in the DB carries provenance and a decay: a price point from 6 months ago in the GPU market is fiction.

### 1.6 Eight kanban columns is a lot — but it's *your* workflow ✅

Normally I'd push back on 8 columns. But New → Interested → Messaged → Negotiating → Pickup Scheduled → Purchased → Sold → Passed maps 1:1 to how flipping actually works, and the terminal columns (Sold, Passed) double as your analytics corpus. Keep it. Make Passed collapse by default so it doesn't eat screen space.

---

## 2. Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENTS                                   │
│  Next.js web app (Vercel)      Chrome Extension (MV3)            │
│  dashboard / analyze / etc.    content script + popup            │
└───────────────┬──────────────────────────┬───────────────────────┘
                │ same-origin fetch        │ POST /api/ingest (API key)
                ▼                          ▼
┌──────────────────────────────────────────────────────────────────┐
│               NEXT.JS ROUTE HANDLERS  (the API)                  │
│                                                                  │
│  /api/deals        CRUD + status transitions                     │
│  /api/analyze      AI pipeline entrypoint (text/URL/image)       │
│  /api/ingest       extension capture endpoint                    │
│  /api/watchlists   rules CRUD                                    │
│  /api/prices       price DB CRUD                                 │
│  /api/cron/poll    Vercel Cron → eBay API + Reddit JSON          │
└──────┬─────────────────────┬────────────────────┬────────────────┘
       │                     │                    │
       ▼                     ▼                    ▼
┌──────────────┐   ┌──────────────────┐   ┌──────────────────────┐
│  Supabase    │   │  AI PIPELINE     │   │  NOTIFIER            │
│  Postgres    │   │  1. extract      │   │  Discord webhook     │
│  + Storage   │   │     (LLM/vision) │   │  Telegram sendMessage│
│  (images)    │   │  2. normalize    │   │  Email (Resend)      │
│              │   │     (alias map)  │   │  fan-out per user    │
│              │   │  3. value        │   │  prefs               │
│              │   │     (price DB —  │   └──────────────────────┘
│              │   │      NOT LLM)    │
│              │   │  4. score+verdict│
│              │   │     (pure fn)    │
└──────────────┘   └──────────────────┘
```

Everything lives in one Vercel deployment + Supabase. No Railway/Render needed until a Python service earns its existence.

---

## 3. Database design (Postgres / Supabase)

```sql
-- Canonical component catalog (the "price database")
create table components (
  id            uuid primary key default gen_random_uuid(),
  category      text not null,          -- gpu | cpu | ram | storage | psu | case | mobo | cooler | prebuilt
  canonical_name text not null unique,  -- "RTX 3060 12GB"
  aliases       text[] not null,        -- {"3060","rtx3060","geforce 3060"}
  buy_value     numeric(10,2),          -- what YOU should pay (used, local)
  resale_value  numeric(10,2),          -- what it sells for
  updated_at    timestamptz default now()
);

-- Provenance-tracked price observations feeding the values above
create table price_points (
  id            uuid primary key default gen_random_uuid(),
  component_id  uuid references components(id),
  price         numeric(10,2) not null,
  source        text not null,          -- own_sale | ebay_sold | asking | manual
  observed_at   timestamptz default now()
);

create table deals (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  url           text,
  source        text not null,          -- facebook | offerup | craigslist | ebay | mercari | jawa | reddit | manual
  asking_price  numeric(10,2) not null,
  est_value     numeric(10,2),          -- sum of component resale values
  est_profit    numeric(10,2),
  status        text not null default 'new',
    -- new|interested|messaged|negotiating|pickup_scheduled|purchased|sold|passed
  verdict       text,                   -- buy | good | negotiate | pass
  score         int,                    -- 0-100
  confidence    int,                    -- 0-100
  reasoning     text,
  seller_name   text,
  distance_mi   numeric(6,1),
  listed_at     timestamptz,
  raw_text      text,                   -- original listing text (re-analyzable)
  images        text[] default '{}',    -- Supabase Storage URLs
  notes         text,
  purchase_price numeric(10,2),         -- actuals, filled as status advances
  sale_price    numeric(10,2),
  fees          numeric(10,2) default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Which components the AI found in a deal
create table deal_components (
  deal_id       uuid references deals(id) on delete cascade,
  component_id  uuid references components(id),
  qty           int default 1,
  condition_note text,
  primary key (deal_id, component_id)
);

create table watchlists (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,           -- "RTX 3060 under $180"
  query         text not null,           -- match text / component alias
  max_price     numeric(10,2),
  max_distance_mi numeric(6,1),
  sources       text[] default '{}',     -- empty = all
  active        boolean default true,
  created_at    timestamptz default now()
);

create table watchlist_hits (
  watchlist_id  uuid references watchlists(id) on delete cascade,
  deal_id       uuid references deals(id) on delete cascade,
  notified_at   timestamptz,
  primary key (watchlist_id, deal_id)    -- natural dedupe: never alert twice
);

create table status_history (              -- powers analytics + "time in stage"
  id         bigserial primary key,
  deal_id    uuid references deals(id) on delete cascade,
  from_status text,
  to_status  text not null,
  changed_at timestamptz default now()
);
```

Add `user_id` columns + RLS policies when multi-user arrives — the schema is designed so that's an additive migration, not a rewrite.

---

## 4. API design

REST, JSON, versioned by path when it goes public. All endpoints under `/api`.

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/deals?status=&source=` | List deals (board data) |
| POST | `/deals` | Create deal (manual) |
| PATCH | `/deals/:id` | Update fields / move status (writes `status_history`) |
| DELETE | `/deals/:id` | Remove |
| POST | `/analyze` | `{text? url? image?}` → runs pipeline, returns analysis (doesn't save) |
| POST | `/ingest` | Extension endpoint: capture payload → analyze → save → watchlist check. Auth: `X-FlipScout-Key` |
| GET/POST | `/watchlists` · PATCH/DELETE `/watchlists/:id` | Rules CRUD |
| GET/POST | `/prices` · PATCH `/prices/:id` | Component catalog CRUD |
| GET | `/analytics` | Aggregates (invested, ROI, best flips…) |
| GET | `/cron/poll` | Vercel Cron: eBay + Reddit polling → watchlist matching → notify |

**The `/ingest` contract** (what the extension sends):

```json
{
  "source": "facebook",
  "url": "https://facebook.com/marketplace/item/...",
  "title": "Gaming PC RTX 2060 Ryzen 5",
  "price": 350,
  "description": "…full listing text…",
  "images": ["data:image/jpeg;base64,…"],
  "location": "Aurora, CO",
  "seller": "John D"
}
```

---

## 5. AI pipeline

Four stages; only stage 1 touches an LLM.

```
input (text | url | screenshot)
  │
  ├─ 1. EXTRACT   — LLM (structured output / JSON schema). Vision model for
  │                 screenshots. Output: [{raw:"rtx2060", qty:1, condition:"used"}...]
  │                 A regex/alias fast-path runs FIRST — if the listing matches
  │                 cleanly, skip the LLM entirely ($0, 0ms, deterministic).
  │
  ├─ 2. NORMALIZE — map raw mentions → canonical components via alias table.
  │                 Unknown parts flagged for human review (and become new
  │                 catalog entries — this is how the price DB grows).
  │
  ├─ 3. VALUE     — pure DB lookup. est_value = Σ resale_value(component).
  │                 NO LLM. Prices come from the provenance-tracked DB.
  │
  └─ 4. SCORE     — pure function:
                    margin = (est_value − asking) / est_value
                    score  = clamp(margin mapped to 0–100)
                    verdict: BUY ≥25% margin · GOOD 10–25% · NEGOTIATE −5–10% · PASS <−5%
                    confidence = f(components matched, text coverage, price-data freshness)
                    reasoning = template + extracted facts (auditable, not vibes)
```

Why this shape wins:
- **Cost**: alias fast-path means most captures cost $0 in tokens.
- **Trust**: every dollar figure traces to a DB row you can inspect.
- **Testability**: stages 2–4 are pure functions — unit-test the money math.
- **Model-agnostic**: swap OpenAI → Claude → local LLM by changing stage 1 only.

---

## 6. Chrome extension (MV3)

```
extension/
├── manifest.json          # MV3, host_permissions for the 5 marketplaces
├── content/scrape.ts      # per-site DOM adapters (fb.ts, offerup.ts, ...)
├── popup/                 # "Analyze with FlipScout" button + result panel
└── background.ts          # service worker: POST /api/ingest, badge state
```

Flow: you open a listing → click the extension → content script reads title/price/description/images *from the DOM you're already viewing* → POST `/api/ingest` → popup shows verdict + score in ~2s → deal is already on your board in "New".

Design notes:
- Per-site adapters are ~30 lines each and **will break when marketplaces change their DOM** — that's the maintenance tax. Fallback: if the adapter fails, capture a screenshot of the tab (`chrome.tabs.captureVisibleTab`) and send it to the vision path. The extension degrades gracefully instead of dying.
- API key in extension storage, set once in the options page.
- Never inject automation, never auto-crawl. User-initiated only.

---

## 7. Notification flow

```
deal ingested/polled → watchlist matcher (SQL: alias match + price ≤ max + distance ≤ max)
  → insert watchlist_hits (PK dedupes — a deal can never alert twice)
  → notifier fan-out, per-channel prefs:
      Discord: webhook embed (rich card: image, price, value, score, link)
      Telegram: bot sendMessage (Markdown)
      Email (Resend): digest mode — batch non-BUY alerts hourly
  → alert copy: "🚨 RTX 2060 — $95 · valued $140 · score 92 · 5 mi · [Open] [Board]"
```

Rules: BUY verdicts send instantly on all channels; GOOD respects quiet hours; everything else lands in the daily digest. Alert fatigue is the #1 killer of notification products — defaults must be conservative.

---

## 8. Folder structure (monolith)

```
flipscout/
├── app/
│   ├── page.tsx                 # dashboard (kanban)
│   ├── analyze/page.tsx         # manual input + AI results
│   ├── watchlists/page.tsx
│   ├── prices/page.tsx          # price database
│   ├── analytics/page.tsx
│   └── api/
│       ├── deals/route.ts  ├── deals/[id]/route.ts
│       ├── analyze/route.ts  ├── ingest/route.ts
│       ├── watchlists/route.ts  ├── prices/route.ts
│       └── cron/poll/route.ts
├── components/                  # DealCard, Board, ScoreBadge, ...
├── lib/
│   ├── analyzer/                # extract.ts, normalize.ts, value.ts, score.ts
│   ├── catalog.ts               # component seed data
│   ├── notify/                  # discord.ts, telegram.ts, email.ts
│   └── store.ts                 # data access (swap JSON → Supabase w/o touching UI)
├── extension/                   # MV3 source (separate build)
└── DESIGN.md
```

---

## 9. UI design

Dark theme, but not the generic near-black-with-neon look. Direction: **night-scout cockpit** — deep blue-slate ground (screens at 11pm energy), amber as the single accent (deal heat / money), semantic green/red reserved strictly for verdicts and profit numbers so they never compete with the accent. Numbers are the product — tabular numerals everywhere, profit rendered larger than price.

- **Dashboard**: horizontal kanban, 8 columns, Passed collapsed by default. Cards lead with *profit and score*, not title — you triage by money, not by prose. Source favicon chip, distance, age. Drag to move status.
- **Card anatomy**: `[$95 → $140] [+$45] [92]` on top; title; meta row (source · 5 mi · 2h ago); verdict stripe on the left edge (color = verdict, readable at a glance while scrolling).
- **Analyze page**: big paste box / URL / screenshot drop → results panel showing extracted parts table, per-part values, verdict block with reasoning. "Save to board" button.
- **Watchlists**: rule rows with live "would have matched N deals this week" feedback.
- **Analytics**: stat tiles (invested, ROI, realized profit) + best-flips table.

The prototype in this repo implements this design — it *is* the wireframe, running.

---

## 10. Roadmap & estimates

Estimates assume solo dev, nights/weekends (~10–15 hrs/wk). Double them if you're new to Next.js.

| Milestone | Scope | Est. |
|-----------|-------|------|
| **M0 — Prototype** (this repo) | Kanban, analyzer (alias engine), watchlists, price DB, analytics, JSON store | ✅ done |
| **M1 — Real persistence** | Supabase Postgres + Storage, migrations, image upload | 1–2 wks |
| **M2 — AI extraction** | OpenAI structured output for messy text, vision for screenshots, fast-path fallback | 1–2 wks |
| **M3 — Extension** | MV3, FB + OfferUp adapters, ingest endpoint, options page | 2–3 wks |
| **M4 — Notifications** | Discord + Telegram, watchlist matcher, quiet hours/digest | 1 wk |
| **M5 — Legit polling** | eBay Browse API + Reddit JSON cron, sold-comp price feedback | 2 wks |
| **M6 — Daily-driver hardening** | Use it for 30 days, fix what hurts, price-DB decay, mobile web | ongoing |
| **M7 — Multi-user SaaS** | Auth (Supabase), RLS, Stripe, onboarding, landing page | 3–4 wks |

MVP you use daily: **~2 months**. Sellable SaaS: **~4–5 months**.

---

## 11. Honest assessment

**Resume: yes, strongly — if you finish M3.** A CRUD kanban is a weekend tutorial. What makes this resume-grade is the combination nobody fakes: a Chrome extension with per-site DOM adapters and graceful vision fallback, an AI pipeline where you can articulate *why the LLM doesn't set prices*, a provenance-tracked price database with feedback loops, and — the killer line in an interview — "I use it every day and here's my ROI chart." Ship the extension + pipeline or it's just another board app.

**Business: viable micro-SaaS, not a venture-scale company.** Sober read:

*For it*: flippers are a real, passionate niche that already pays for tools (Flipmine, Vendoo, Crosslist run $20–50/mo in the adjacent reseller space); the sourcing side (find deals) is far less served than the selling side (crosslisting); your ingestion design avoids the ToS cliff that kills competitors; the price database compounds into a moat if you get the feedback loops right.

*Against it*: the biggest inventory pool (Facebook) can never be first-class-automated, permanently capping the "wake up to deals" dream for the best source; the addressable market of serious PC flippers is maybe tens of thousands, not millions; Discord bots already serve GPU deal alerts for free on the eBay side; churn risk is high (people flip for 18 months and quit).

Realistic ceiling as a business: **$2–10k MRR** at $15–25/mo if you nail the extension experience and expand categories (the schema already supports it — `category` is a column, not an assumption). That's a great side business and a fantastic story. It is not a rocket ship, and that's fine — build it because you'll use it Tuesday night, and let the SaaS be upside.

**Build it.** The worst case is a tool that makes you money twice: on every flip, and in every interview.
