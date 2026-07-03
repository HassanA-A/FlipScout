// @ts-nocheck
import { createClient } from "@supabase/supabase-js";
import type { Db, Deal, Watchlist } from "./types";

let supabase: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (supabase) return supabase;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required. See SETUP.md for instructions."
    );
  }

  supabase = createClient(supabaseUrl, supabaseKey);
  return supabase;
}

export async function readDb(): Promise<Db> {
  const sb = getSupabase();

  const [deals, watchlists] = await Promise.all([
    sb.from("deals").select("*").order("created_at", { ascending: false }),
    sb.from("watchlists").select("id, name, query, max_price, active").order("created_at", { ascending: false }),
  ]);

  return {
    deals: (deals.data || []) as Deal[],
    watchlists: (watchlists.data || []) as Watchlist[],
    priceOverrides: {},
  };
}

export async function writeDb(_db: Db): Promise<void> {
  // No-op
}

export async function createDeal(deal: Omit<Deal, "id" | "createdAt" | "updatedAt">): Promise<Deal> {
  const sb = getSupabase();
  const { data, error } = await sb.from("deals").insert([deal]).select().single();
  if (error) throw error;
  return data as Deal;
}

export async function updateDeal(id: string, patch: Partial<Deal>): Promise<Deal> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("deals")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Deal;
}

export async function deleteDeal(id: string): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb.from("deals").delete().eq("id", id);
  if (error) throw error;
}

export async function createWatchlist(wl: Omit<Watchlist, "id">): Promise<Watchlist> {
  const sb = getSupabase();
  const { data, error } = await sb.from("watchlists").insert([wl]).select().single();
  if (error) throw error;
  return data as Watchlist;
}

export async function updateWatchlist(id: string, patch: Partial<Watchlist>): Promise<Watchlist> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("watchlists")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Watchlist;
}

export async function deleteWatchlist(id: string): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb.from("watchlists").delete().eq("id", id);
  if (error) throw error;
}

export function newId(): string {
  return crypto.randomUUID();
}
