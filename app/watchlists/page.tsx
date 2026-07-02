"use client";

import { useEffect, useState } from "react";
import { money } from "@/lib/board";

interface WatchlistRow {
  id: string;
  name: string;
  query: string;
  maxPrice?: number;
  active: boolean;
  matches: string[];
}

export default function WatchlistsPage() {
  const [lists, setLists] = useState<WatchlistRow[]>([]);
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  async function load() {
    const res = await fetch("/api/watchlists");
    setLists(await res.json());
  }
  useEffect(() => {
    load();
  }, []);

  async function add() {
    if (!query) return;
    await fetch("/api/watchlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name || `${query}${maxPrice ? ` under $${maxPrice}` : ""}`,
        query,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
      }),
    });
    setName("");
    setQuery("");
    setMaxPrice("");
    load();
  }

  async function toggle(id: string, active: boolean) {
    await fetch("/api/watchlists", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active }),
    });
    load();
  }

  async function remove(id: string) {
    await fetch("/api/watchlists", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-lg font-semibold text-ink">Watchlists</h1>
      <p className="mb-6 text-sm text-mut">
        Rules run against every deal that enters the system — extension
        captures, manual adds, and (milestone M5) automated eBay + Reddit
        polling. Matches fire Discord/Telegram alerts in M4; here they show
        live match counts against your board.
      </p>

      <div className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-line bg-surface p-4">
        <label className="flex-1 text-[11px] font-semibold uppercase tracking-wider text-faint">
          Match text *
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="rtx 3060"
            className="mt-1 w-full rounded-md border border-line bg-ground px-2 py-1.5 text-sm text-ink placeholder:text-faint"
          />
        </label>
        <label className="w-28 text-[11px] font-semibold uppercase tracking-wider text-faint">
          Max price
          <input
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            inputMode="decimal"
            placeholder="180"
            className="num mt-1 w-full rounded-md border border-line bg-ground px-2 py-1.5 text-sm text-ink placeholder:text-faint"
          />
        </label>
        <label className="flex-1 text-[11px] font-semibold uppercase tracking-wider text-faint">
          Name (optional)
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="auto-generated"
            className="mt-1 w-full rounded-md border border-line bg-ground px-2 py-1.5 text-sm text-ink placeholder:text-faint"
          />
        </label>
        <button
          onClick={add}
          disabled={!query}
          className="rounded-md bg-accent px-4 py-1.5 text-sm font-semibold text-ground hover:brightness-110 disabled:opacity-40"
        >
          Add rule
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {lists.map((w) => (
          <div
            key={w.id}
            className={`flex items-center justify-between rounded-lg border border-line bg-surface px-4 py-3 ${
              w.active ? "" : "opacity-50"
            }`}
          >
            <div>
              <div className="text-sm font-medium text-ink">{w.name}</div>
              <div className="text-[12px] text-mut">
                matches “{w.query}”
                {w.maxPrice !== undefined && <> · under {money(w.maxPrice)}</>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`num rounded px-2 py-1 text-[12px] font-semibold ${
                  w.matches.length > 0 ? "bg-buy/15 text-buy" : "bg-raised text-faint"
                }`}
              >
                {w.matches.length} match{w.matches.length === 1 ? "" : "es"}
              </span>
              <button
                onClick={() => toggle(w.id, !w.active)}
                className="rounded-md border border-line px-2.5 py-1 text-[12px] text-mut hover:text-ink"
              >
                {w.active ? "Pause" : "Resume"}
              </button>
              <button
                onClick={() => remove(w.id)}
                className="rounded-md border border-pass/30 px-2.5 py-1 text-[12px] text-pass hover:bg-pass/10"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {lists.length === 0 && (
          <div className="rounded-lg border border-dashed border-line py-10 text-center text-sm text-faint">
            No watchlist rules yet.
          </div>
        )}
      </div>
    </div>
  );
}
