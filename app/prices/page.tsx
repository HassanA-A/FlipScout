"use client";

import { useEffect, useState } from "react";
import type { CatalogComponent, Category } from "@/lib/types";

const CATEGORY_LABEL: Record<Category, string> = {
  gpu: "GPUs",
  cpu: "CPUs",
  ram: "Memory",
  storage: "Storage",
  psu: "Power supplies",
  mobo: "Motherboards",
  case: "Cases",
  cooler: "Cooling",
};

const ORDER: Category[] = ["gpu", "cpu", "ram", "storage", "psu", "mobo", "case", "cooler"];

export default function PricesPage() {
  const [items, setItems] = useState<CatalogComponent[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/prices").then((r) => r.json()).then(setItems);
  }, []);

  async function update(id: string, field: "buyValue" | "resaleValue", value: number) {
    setSavingId(id);
    const res = await fetch("/api/prices", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, [field]: value }),
    });
    const updated = await res.json();
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...updated } : x)));
    setSavingId(null);
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-lg font-semibold text-ink">Price database</h1>
      <p className="mb-6 text-sm text-mut">
        Every valuation the analyzer produces traces to a row here — the LLM
        never sets prices. Edit values inline; changes apply to all future
        analyses. In production these update automatically from your own sales
        and eBay sold comps, with freshness decay.
      </p>

      {ORDER.map((cat) => {
        const rows = items.filter((i) => i.category === cat);
        if (rows.length === 0) return null;
        return (
          <section key={cat} className="mb-6">
            <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-faint">
              {CATEGORY_LABEL[cat]}
            </h2>
            <div className="overflow-hidden rounded-xl border border-line">
              <div className="grid grid-cols-[1fr_110px_110px] gap-2 border-b border-line bg-surface px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-faint">
                <span>Component</span>
                <span className="text-right">Buy at</span>
                <span className="text-right">Resells for</span>
              </div>
              {rows.map((c) => (
                <div
                  key={c.id}
                  className={`grid grid-cols-[1fr_110px_110px] items-center gap-2 border-b border-line bg-ground/40 px-4 py-2 last:border-b-0 ${
                    savingId === c.id ? "opacity-60" : ""
                  }`}
                >
                  <div>
                    <div className="text-sm text-ink">{c.name}</div>
                    <div className="text-[11px] text-faint">
                      aliases: {c.aliases.join(", ")}
                    </div>
                  </div>
                  <PriceCell value={c.buyValue} onCommit={(v) => update(c.id, "buyValue", v)} />
                  <PriceCell value={c.resaleValue} onCommit={(v) => update(c.id, "resaleValue", v)} />
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function PriceCell({ value, onCommit }: { value: number; onCommit: (v: number) => void }) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);
  return (
    <input
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => {
        const n = Number(text);
        if (!Number.isNaN(n) && n !== value) onCommit(n);
        else setText(String(value));
      }}
      inputMode="decimal"
      className="num w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-right text-sm text-ink hover:border-line focus:border-line focus:bg-surface"
    />
  );
}
