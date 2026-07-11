# FlipScout Setup Guide

## 1. Install dependencies

```bash
npm install
```

## 2. Set up Supabase

### Create a free account
1. Go to https://supabase.com
2. Sign up (free tier is generous)
3. Create a new project
4. Wait for it to provision (~2 min)

### Get your credentials
1. In Supabase, go to **Settings** → **API Keys**
2. Copy your **Project URL** (looks like `https://xxxxx.supabase.co`)
3. Copy your **Publishable key** (starts with `sb_publishable_`)

### Create the database schema
1. In Supabase, go to **SQL Editor**
2. Run the contents of `supabase/migrations/0001_init.sql`
3. Run the deals/watchlists auth SQL (adds `user_id` columns + RLS policies — see DESIGN.md §security or the project history)
4. Run the contents of `supabase/migrations/0002_rls_hardening.sql`

### Enable email auth
1. In Supabase, go to **Authentication** → **Sign In / Providers**
2. Make sure **Email** is enabled

### Add credentials to your app
1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Edit `.env.local` and paste your Supabase URL and publishable key
   into **all four** variables (the `NEXT_PUBLIC_` pair is required).

## 3. Run locally

```bash
npm run dev
```

Open http://localhost:3000 — you'll be redirected to `/auth`.
Create an account, then the board loads with **your** deals only.

## 4. Load the browser extension

The same `extension/` folder works in **Chrome, Firefox, and Zen** (Manifest V3).

### Firefox / Zen
1. Type `about:debugging#/runtime/this-firefox` in the address bar
2. Click **Load Temporary Add-on**
3. Select `extension/manifest.json`

> Temporary add-ons unload when the browser restarts — just load it again.
> For a permanent install the extension must be signed via addons.mozilla.org
> (free, unlisted signing is fine for personal use).

### Chrome
1. Go to `chrome://extensions`
2. Turn on **Developer mode** (top right)
3. Click **Load unpacked** and select the `extension/` folder

### Use it
1. Open a marketplace listing (Facebook Marketplace, OfferUp, Craigslist…)
2. Click the FlipScout icon
3. Set the endpoint (`http://localhost:3000` or your Vercel URL — no trailing slash needed, it's normalized)
4. **Sign in with the same email/password you use on the website**
5. Click **Analyze with FlipScout** — the deal is analyzed and saved to your board

## 5. Deploy to Vercel

1. Connect the GitHub repo to a Vercel project
2. In Vercel **Environment Variables**, add all four (Production):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
3. Push to the production branch — Vercel builds automatically
4. In Supabase **Authentication → URL Configuration**, set the **Site URL**
   to your Vercel URL so signup-confirmation emails link to the right place
5. Point the extension's endpoint at your Vercel URL and sign in

---

## Troubleshooting

**Redirect loop or "Supabase env vars missing"**
- All four env vars must be set (`NEXT_PUBLIC_` pair included)
- Restart `npm run dev` after editing `.env.local`

**Extension says "Sign in required" / "Session expired"**
- Open the popup and sign in with your FlipScout account
- The popup keeps a refresh token, so this should be rare

**Extension NetworkError**
- Check the endpoint URL (the popup strips trailing slashes automatically)
- Make sure the latest code is deployed (`/api/config` must exist — open
  `https://your-app.vercel.app/api/config` in a tab; you should see JSON)

**Board is empty but I saved deals before adding auth**
- Pre-auth rows have no owner (`user_id IS NULL`), so RLS hides them.
  See the bottom of `supabase/migrations/0002_rls_hardening.sql` to claim
  or delete them.
