"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Analysis, Source } from "@/lib/types";
import { money } from "@/lib/board";
import { ScoreChip, VerdictBadge } from "@/components/VerdictBadge";

const SOURCES: Source[] = [
  "facebook", "offerup", "craigslist", "ebay", "mercari", "jawa", "reddit", "manual",
];

export default function AnalyzePage() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [price, setPrice] = useState("");
  const [title, setTitle] = useState("");
  const [source, setSource] = useState<Source>("facebook");
  const [url, setUrl] = useState("");
  const [distance, setDistance] = useState("");
  const [seller, setSeller] = useState("");
  const [result, setResult] = useState<Analysis | null>(null);
  const [busy, setBusy] = useState(false);

  async function runAnalysis() {
    if (!text || !price) return;
    setBusy(true);
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, askingPrice: Number(price) }),
    });
    setResult(await res.json());
    setBusy(false);
  }

  async function saveToBoard() {
    setBusy(true);
    await fetch("/api/deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title || text.split("\n")[0].slice(0, 80),
        askingPrice: Number(price),
        rawText: text,
        source,
        url: url || undefined,
        seller: seller || undefined,
        distanceMi: distance ? Number(distance) : undefined,
      }),
    });
    router.push("/");
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-lg font-semibold text-ink">Analyze a listing</h1>
      <p className="mb-6 text-sm text-mut">
        Paste the listing text, set the asking price. The alias engine extracts
        parts and values them from the price database — no scraping, no
        hallucinated prices. Screenshots and messy-text LLM extraction land in
        milestone M2.
      </p>

      <div className="mb-4 grid gap-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          placeholder={`Paste listing text…\n\ne.g. "Custom gaming PC. Ryzen 5 5600X, RTX 3060 12GB, 16GB DDR4, 1TB NVMe, 650W gold PSU"`}
          className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-faint"
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-faint">
            Asking price *
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              inputMode="decimal"
              placeholder="350"
              className="num mt-1 w-full rounded-md border border-line bg-surface px-2 py-1.5 text-sm text-ink"
            />
          </label>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-faint">
            Source
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as Source)}
              className="mt-1 w-full rounded-md border border-line bg-surface px-2 py-1.5 text-sm text-ink"
            >
              {SOURCES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-faint">
            Distance (mi)
            <input
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              inputMode="decimal"
              placeholder="5"
              className="num mt-1 w-full rounded-md border border-line bg-surface px-2 py-1.5 text-sm text-ink"
            />
          </label>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-faint">
            Seller
            <input
              value={seller}
              onChange={(e) => setSeller(e.target.value)}
              placeholder="name"
              className="mt-1 w-full rounded-md border border-line bg-surface px-2 py-1.5 text-sm text-ink"
            />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-faint">
            Title (optional)
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="defaults to first line of text"
              className="mt-1 w-full rounded-md border border-line bg-surface px-2 py-1.5 text-sm text-ink placeholder:text-faint"
            />
          </label>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-faint">
            Listing URL (optional)
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              className="mt-1 w-full rounded-md border border-line bg-surface px-2 py-1.5 text-sm text-ink placeholder:text-faint"
            />
          </label>
        </div>
      </div>

      <button
        onClick={runAnalysis}
        disabled={busy || !text || !price}
        className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-ground hover:brightness-110 disabled:opacity-40"
      >
        {busy ? "Analyzing…" : "Analyze"}
      </button>

      {result && (
        <div className="mt-6 rounded-xl border border-line bg-surface p-5">
          <div className="mb-3 flex items-center gap-3">
            <VerdictBadge verdict={result.verdict} />
            <ScoreChip score={result.score} />
            <span className="num text-lg font-bold text-ink">{money(Number(price))}</span>
            <span className="text-faint">→</span>
            <span className="num text-lg text-mut">{money(result.estValue)}</span>
            <span
              className={`num text-lg font-bold ${result.estProfit > 0 ? "text-buy" : "text-pass"}`}
            >
              {result.estProfit >= 0 ? "+" : "−"}{money(Math.abs(result.estProfit))}
            </span>
          </div>
          <p className="mb-4 text-[13px] leading-relaxed text-mut">
            {result.reasoning}
            <span className="mt-1 block text-[11px] text-faint">
              Confidence {result.confidence}%
            </span>
          </p>
          {result.parts.length > 0 && (
            <div className="mb-4 overflow-hidden rounded-lg border border-line">
              {result.parts.map((p) => (
                <div
                  key={p.componentId}
                  className="flex items-center justify-between border-b border-line bg-ground/40 px-3 py-1.5 text-[13px] last:border-b-0"
                >
                  <span className="text-ink">{p.name}</span>
                  <span className="num text-mut">{money(p.resaleValue)}</span>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={saveToBoard}
            disabled={busy}
            className="rounded-md border border-accent px-4 py-2 text-sm font-semibold text-accent hover:bg-accent/10 disabled:opacity-40"
          >
            Save to board →
          </button>
        </div>
      )}
    </div>
  );
}
