// @ts-nocheck
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Db, Deal, Watchlist } from "./types";

/**
 * All functions take a Supabase client bound to the current user
 * (cookie session for web, bearer token for the extension) so that
 * Row Level Security applies to every query.
 */

function toDeal(row: any): Deal {
  return {
    id: row.id,
    title: row.title,
    url: row.url,
    source: row.source,
    askingPrice: row.asking_price,
    estValue: row.est_value,
    estProfit: row.est_profit,
    status: row.status,
    verdict: row.verdict,
    score: row.score,
    confidence: row.confidence,
    reasoning: row.reasoning,
    seller: row.seller_name,
    distanceMi: row.distance_mi,
    listedAt: row.listed_at,
    rawText: row.raw_text,
    notes: row.notes,
    purchasePrice: row.purchase_price,
    salePrice: row.sale_price,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toWatchlist(row: any): Watchlist {
  return {
    id: row.id,
    name: row.name,
    query: row.query,
    maxPrice: row.max_price,
    active: row.active,
  };
}

export async function readDb(sb: SupabaseClient): Promise<Db> {
  const [deals, watchlists] = await Promise.all([
    sb.from("deals").select("*").order("created_at", { ascending: false }),
    sb.from("watchlists").select("*").order("created_at", { ascending: false }),
  ]);

  if (deals.error) throw deals.error;
  if (watchlists.error) throw watchlists.error;

  return {
    deals: (deals.data || []).map(toDeal),
    watchlists: (watchlists.data || []).map(toWatchlist),
    priceOverrides: {},
  };
}

export async function createDeal(
  sb: SupabaseClient,
  deal: Omit<Deal, "id" | "createdAt" | "updatedAt">,
  userId: string
): Promise<Deal> {
  const record = {
    user_id: userId,
    title: deal.title,
    url: deal.url,
    source: deal.source,
    asking_price: deal.askingPrice,
    est_value: deal.estValue,
    est_profit: deal.estProfit,
    status: deal.status,
    verdict: deal.verdict,
    score: deal.score,
    confidence: deal.confidence,
    reasoning: deal.reasoning,
    seller_name: deal.seller,
    distance_mi: deal.distanceMi,
    listed_at: deal.listedAt,
    raw_text: deal.rawText,
    notes: deal.notes,
  };
  const { data, error } = await sb.from("deals").insert([record]).select().single();
  if (error) throw error;
  return toDeal(data);
}

export async function updateDeal(
  sb: SupabaseClient,
  id: string,
  patch: Partial<Deal>
): Promise<Deal> {
  const record: any = { updated_at: new Date().toISOString() };
  if (patch.title !== undefined) record.title = patch.title;
  if (patch.url !== undefined) record.url = patch.url;
  if (patch.askingPrice !== undefined) record.asking_price = patch.askingPrice;
  if (patch.estValue !== undefined) record.est_value = patch.estValue;
  if (patch.estProfit !== undefined) record.est_profit = patch.estProfit;
  if (patch.status !== undefined) record.status = patch.status;
  if (patch.verdict !== undefined) record.verdict = patch.verdict;
  if (patch.score !== undefined) record.score = patch.score;
  if (patch.confidence !== undefined) record.confidence = patch.confidence;
  if (patch.reasoning !== undefined) record.reasoning = patch.reasoning;
  if (patch.seller !== undefined) record.seller_name = patch.seller;
  if (patch.distanceMi !== undefined) record.distance_mi = patch.distanceMi;
  if (patch.listedAt !== undefined) record.listed_at = patch.listedAt;
  if (patch.rawText !== undefined) record.raw_text = patch.rawText;
  if (patch.notes !== undefined) record.notes = patch.notes;
  if (patch.purchasePrice !== undefined) record.purchase_price = patch.purchasePrice;
  if (patch.salePrice !== undefined) record.sale_price = patch.salePrice;

  const { data, error } = await sb
    .from("deals")
    .update(record)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return toDeal(data);
}

export async function deleteDeal(sb: SupabaseClient, id: string): Promise<void> {
  const { error } = await sb.from("deals").delete().eq("id", id);
  if (error) throw error;
}

export async function createWatchlist(
  sb: SupabaseClient,
  wl: Omit<Watchlist, "id">,
  userId: string
): Promise<Watchlist> {
  const record = {
    user_id: userId,
    name: wl.name,
    query: wl.query,
    max_price: wl.maxPrice,
    active: wl.active,
  };
  const { data, error } = await sb.from("watchlists").insert([record]).select().single();
  if (error) throw error;
  return toWatchlist(data);
}

export async function updateWatchlist(
  sb: SupabaseClient,
  id: string,
  patch: Partial<Watchlist>
): Promise<Watchlist> {
  const record: any = {};
  if (patch.name !== undefined) record.name = patch.name;
  if (patch.query !== undefined) record.query = patch.query;
  if (patch.maxPrice !== undefined) record.max_price = patch.maxPrice;
  if (patch.active !== undefined) record.active = patch.active;

  const { data, error } = await sb
    .from("watchlists")
    .update(record)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return toWatchlist(data);
}

export async function deleteWatchlist(sb: SupabaseClient, id: string): Promise<void> {
  const { error } = await sb.from("watchlists").delete().eq("id", id);
  if (error) throw error;
}

export function newId(): string {
  return crypto.randomUUID();
}
