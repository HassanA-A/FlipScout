import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { analyze } from "./analyzer";
import type { Db, Deal, DealStatus, Source, Watchlist } from "./types";

/**
 * Prototype persistence: a JSON file. lib/store.ts is the only module that
 * knows this — swapping to Supabase Postgres (milestone M1) touches nothing
 * else. Do not import fs anywhere outside this file.
 */

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3600_000).toISOString();
}

interface SeedDeal {
  title: string;
  source: Source;
  askingPrice: number;
  status: DealStatus;
  rawText: string;
  seller?: string;
  distanceMi?: number;
  listedHoursAgo?: number;
  notes?: string;
  url?: string;
  purchasePrice?: number;
  salePrice?: number;
}

const SEED_DEALS: SeedDeal[] = [
  {
    title: "EVGA RTX 2060 — works great",
    source: "facebook", askingPrice: 95, status: "new",
    rawText: "EVGA RTX 2060 graphics card, works great, upgraded to a 4070. No box.",
    seller: "Marcus T", distanceMi: 5.2, listedHoursAgo: 2,
    url: "https://facebook.com/marketplace/item/2060-demo",
  },
  {
    title: "Gaming PC - Ryzen 5600X / RTX 3060",
    source: "offerup", askingPrice: 420, status: "new",
    rawText: "Custom gaming PC. Ryzen 5 5600X, RTX 3060 12GB, 16GB DDR4 3200, 1TB NVMe, 650W gold PSU, B550 board, NZXT H510 case. Runs everything.",
    seller: "PCDeals303", distanceMi: 11.4, listedHoursAgo: 6,
    url: "https://offerup.com/item/detail/demo-5600x-3060",
  },
  {
    title: "RX 6600 XFX, barely used",
    source: "craigslist", askingPrice: 130, status: "new",
    rawText: "XFX RX 6600 GPU, barely used, bought for a build I never finished.",
    seller: "cl-denver", distanceMi: 8.9, listedHoursAgo: 14,
    url: "https://denver.craigslist.org/sys/demo-6600",
  },
  {
    title: "i7-10700K + B550 combo",
    source: "reddit", askingPrice: 210, status: "interested",
    rawText: "[USA-CO][H] i7-10700K, B550 motherboard, 32GB DDR4 [W] PayPal. Prices firm-ish.",
    seller: "u/hwswapper22", distanceMi: 0, listedHoursAgo: 20,
    notes: "Rep check ok. Ask if he'll split the RAM out.",
    url: "https://reddit.com/r/hardwareswap/demo",
  },
  {
    title: "RTX 3070 FE, adult owned",
    source: "facebook", askingPrice: 260, status: "messaged",
    rawText: "RTX 3070 Founders Edition. Adult owned, never mined. Cash only.",
    seller: "Dana W", distanceMi: 3.1, listedHoursAgo: 30,
    notes: "Messaged 10am — asked if still available.",
  },
  {
    title: "Full setup: 5800X / 3060 Ti + 32GB",
    source: "offerup", askingPrice: 520, status: "negotiating",
    rawText: "Selling my rig: Ryzen 7 5800X, RTX 3060 Ti, 32GB DDR4, 1TB NVMe, 750W gold, 240mm AIO, mid tower case.",
    seller: "TechFlip", distanceMi: 15.7, listedHoursAgo: 48,
    notes: "Offered $440, they countered $480. Try $460.",
  },
  {
    title: "GTX 1660 Super - $70",
    source: "mercari", askingPrice: 70, status: "pickup_scheduled",
    rawText: "GTX 1660 Super, tested working, dusty but runs cool.",
    seller: "mercariuser9", distanceMi: 6.5, listedHoursAgo: 70,
    notes: "Pickup Sat 2pm, King Soopers lot on Colfax.",
  },
  {
    title: "Ryzen 5 3600 + B450",
    source: "facebook", askingPrice: 90, status: "purchased",
    rawText: "Ryzen 5 3600 with B450 motherboard, pulled from working system.",
    seller: "Alex R", distanceMi: 4.0, listedHoursAgo: 120,
    purchasePrice: 75, notes: "Paid $75 cash. Pins fine, tested at home.",
  },
  {
    title: "RTX 3080 — quick sale",
    source: "facebook", askingPrice: 300, status: "sold",
    rawText: "RTX 3080 10GB, moving and need it gone this weekend.",
    seller: "Sam K", distanceMi: 9.3, listedHoursAgo: 400,
    purchasePrice: 280, salePrice: 405, notes: "Sold on hardwareswap in 2 days.",
  },
  {
    title: "RX 580 8GB",
    source: "craigslist", askingPrice: 60, status: "sold",
    rawText: "RX 580 8GB, works fine, older card.",
    seller: "cl-aurora", distanceMi: 12.0, listedHoursAgo: 600,
    purchasePrice: 45, salePrice: 78, notes: "Flipped local, quick $33.",
  },
  {
    title: "\"Gaming PC\" i5-12400F GT 1030",
    source: "offerup", askingPrice: 450, status: "passed",
    rawText: "Gaming PC i5-12400F, 16GB, GT 1030 graphics. Plays Fortnite!",
    seller: "QuickSell", distanceMi: 22.0, listedHoursAgo: 90,
    notes: "GT 1030 doing heavy lifting in the photos. Way overpriced.",
  },
];

const SEED_WATCHLISTS: Omit<Watchlist, "id">[] = [
  { name: "RTX 3060 under $180", query: "rtx 3060", maxPrice: 180, active: true },
  { name: "RTX 2060 under $110", query: "rtx 2060", maxPrice: 110, active: true },
  { name: "5600X under $90", query: "5600x", maxPrice: 90, active: true },
  { name: "RX 6600 under $150", query: "rx 6600", maxPrice: 150, active: true },
  { name: "Cases under $30", query: "case", maxPrice: 30, active: false },
];

function buildSeed(): Db {
  const deals: Deal[] = SEED_DEALS.map((s) => {
    const a = analyze(s.rawText, s.askingPrice);
    const listedAt = hoursAgo(s.listedHoursAgo ?? 1);
    return {
      id: randomUUID(),
      title: s.title,
      url: s.url,
      source: s.source,
      askingPrice: s.askingPrice,
      estValue: a.estValue,
      estProfit: a.estProfit,
      status: s.status,
      verdict: a.verdict,
      score: a.score,
      confidence: a.confidence,
      reasoning: a.reasoning,
      parts: a.parts,
      seller: s.seller,
      distanceMi: s.distanceMi,
      listedAt,
      rawText: s.rawText,
      notes: s.notes,
      purchasePrice: s.purchasePrice,
      salePrice: s.salePrice,
      createdAt: listedAt,
      updatedAt: listedAt,
    };
  });

  return {
    deals,
    watchlists: SEED_WATCHLISTS.map((w) => ({ ...w, id: randomUUID() })),
    priceOverrides: {},
  };
}

export function readDb(): Db {
  if (!fs.existsSync(DB_PATH)) {
    const seed = buildSeed();
    writeDb(seed);
    return seed;
  }
  return JSON.parse(fs.readFileSync(DB_PATH, "utf8")) as Db;
}

export function writeDb(db: Db): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

export function newId(): string {
  return randomUUID();
}
