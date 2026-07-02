import type { DealStatus, Source, Verdict } from "./types";

export const COLUMNS: { id: DealStatus; label: string }[] = [
  { id: "new", label: "New" },
  { id: "interested", label: "Interested" },
  { id: "messaged", label: "Messaged" },
  { id: "negotiating", label: "Negotiating" },
  { id: "pickup_scheduled", label: "Pickup Scheduled" },
  { id: "purchased", label: "Purchased" },
  { id: "sold", label: "Sold" },
  { id: "passed", label: "Passed" },
];

export const SOURCE_LABEL: Record<Source, string> = {
  facebook: "FB",
  offerup: "OU",
  craigslist: "CL",
  ebay: "EB",
  mercari: "ME",
  jawa: "JW",
  reddit: "RD",
  manual: "MN",
};

export const VERDICT_LABEL: Record<Verdict, string> = {
  buy: "BUY",
  good: "GOOD",
  negotiate: "NEGOTIATE",
  pass: "PASS",
};

export function timeAgo(iso: string): string {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 48) return `${hrs}h`;
  return `${Math.round(hrs / 24)}d`;
}

export function money(n: number | undefined | null): string {
  if (n === undefined || n === null) return "—";
  return `$${Math.round(n).toLocaleString("en-US")}`;
}
