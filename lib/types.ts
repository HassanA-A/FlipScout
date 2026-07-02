export type DealStatus =
  | "new"
  | "interested"
  | "messaged"
  | "negotiating"
  | "pickup_scheduled"
  | "purchased"
  | "sold"
  | "passed";

export type Verdict = "buy" | "good" | "negotiate" | "pass";

export type Source =
  | "facebook"
  | "offerup"
  | "craigslist"
  | "ebay"
  | "mercari"
  | "jawa"
  | "reddit"
  | "manual";

export type Category =
  | "gpu"
  | "cpu"
  | "ram"
  | "storage"
  | "psu"
  | "case"
  | "mobo"
  | "cooler";

export interface CatalogComponent {
  id: string;
  category: Category;
  name: string;
  /** lowercase alias strings matched with word boundaries, longest-first */
  aliases: string[];
  /** target price to pay, used/local */
  buyValue: number;
  /** expected resale, used/local */
  resaleValue: number;
}

export interface ExtractedPart {
  componentId: string;
  name: string;
  category: Category;
  qty: number;
  resaleValue: number;
}

export interface Analysis {
  parts: ExtractedPart[];
  estValue: number;
  estProfit: number;
  marginPct: number;
  score: number;
  verdict: Verdict;
  confidence: number;
  reasoning: string;
}

export interface Deal {
  id: string;
  title: string;
  url?: string;
  source: Source;
  askingPrice: number;
  estValue?: number;
  estProfit?: number;
  status: DealStatus;
  verdict?: Verdict;
  score?: number;
  confidence?: number;
  reasoning?: string;
  parts?: ExtractedPart[];
  seller?: string;
  distanceMi?: number;
  listedAt?: string;
  rawText?: string;
  notes?: string;
  purchasePrice?: number;
  salePrice?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Watchlist {
  id: string;
  name: string;
  /** free-text query matched against catalog aliases + deal text */
  query: string;
  maxPrice?: number;
  active: boolean;
}

export interface Db {
  deals: Deal[];
  watchlists: Watchlist[];
  /** overrides to catalog values, keyed by component id */
  priceOverrides: Record<string, { buyValue: number; resaleValue: number }>;
}
