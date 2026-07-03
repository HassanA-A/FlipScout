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
1. In Supabase, go to **Settings** → **API**
2. Copy your **Project URL** (looks like `https://xxxxx.supabase.co`)
3. Copy your **anon public key** (the long string under "anon")

### Create the database schema
1. In Supabase, go to **SQL Editor**
2. Click **+ New query**
3. Copy-paste the entire contents of `supabase/migrations/0001_init.sql`
4. Click **Run**
5. Wait for it to complete (you'll see the tables and seed data appear)

### Add credentials to your app
1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Edit `.env.local` and paste your Supabase URL and anon key

## 3. Run locally

```bash
npm run dev
```

Open http://localhost:3000. The board should load with seed deals from Supabase.

## 4. Load the Firefox extension

1. In Zen (or Firefox):
   - Type `about:debugging` in the address bar
   - Click **This Firefox** on the left
   - Click **Load Temporary Add-on**
   - Navigate to your `FlipScout/extension/` folder
   - Select any file in there (e.g., `manifest.json`)
   - Click **Open**

2. The FlipScout icon should appear in the toolbar

3. **Test it:**
   - Open a marketplace listing (Facebook, OfferUp, etc.)
   - Click the FlipScout icon
   - Enter `http://localhost:3000` in the endpoint field
   - Click "Analyze with FlipScout"
   - Should see the analysis and deal on your board

## 5. Deploy to Vercel

Once you're happy with it locally:

```bash
npm install -g vercel
vercel
```

This will:
1. Push your code to Vercel
2. Ask for your Supabase env vars
3. Give you a public URL

Then update the extension to use your Vercel URL instead of `localhost:3000`.

---

## Troubleshooting

**"SUPABASE_URL and SUPABASE_ANON_KEY not set"**
- Make sure `.env.local` exists and has the right keys
- Restart `npm run dev` after adding .env.local

**"Extension can't connect to the app"**
- Make sure you entered the endpoint URL correctly in the extension popup
- Check that `npm run dev` is still running
- Check browser console for errors (right-click → Inspect → Console)

**"No seed data appears on the board"**
- The schema migration might have failed. Check Supabase SQL Editor for errors.
- Try running the migration again.
