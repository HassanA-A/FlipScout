"use client";

import { useEffect, useState } from "react";
import type { Deal, DealStatus } from "@/lib/types";
import { COLUMNS, money } from "@/lib/board";
import { DealCard } from "./DealCard";
import { DealModal } from "./DealModal";

export function Board({ initialDeals }: { initialDeals: Deal[] }) {
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [open, setOpen] = useState<Deal | null>(null);
  const [showPassed, setShowPassed] = useState(false);
  const [dragOver, setDragOver] = useState<DealStatus | null>(null);

  useEffect(() => setDeals(initialDeals), [initialDeals]);

  async function patchDeal(id: string, patch: Partial<Deal>) {
    setDeals((ds) => ds.map((d) => (d.id === id ? { ...d, ...patch } : d)));
    await fetch(`/api/deals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  }

  async function deleteDeal(id: string) {
    setDeals((ds) => ds.filter((d) => d.id !== id));
    await fetch(`/api/deals/${id}`, { method: "DELETE" });
  }

  function onDragStart(e: React.DragEvent, deal: Deal) {
    e.dataTransfer.setData("text/plain", deal.id);
    e.dataTransfer.effectAllowed = "move";
  }

  function onDrop(e: React.DragEvent, status: DealStatus) {
    e.preventDefault();
    setDragOver(null);
    const id = e.dataTransfer.getData("text/plain");
    if (id) patchDeal(id, { status });
  }

  const pipelineProfit = deals
    .filter((d) => !["sold", "passed"].includes(d.status))
    .reduce((s, d) => s + (d.estProfit ?? 0), 0);

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-line px-5 py-3">
        <div>
          <h1 className="text-sm font-semibold text-ink">Deal board</h1>
          <p className="text-[11px] text-faint">
            Drag cards between stages · click a card for analysis &amp; notes
          </p>
        </div>
        <div className="flex items-center gap-4 text-[12px] text-mut">
          <span>
            {deals.length} deals ·{" "}
            <span className="num font-semibold text-buy">+{money(pipelineProfit)}</span>{" "}
            est. in pipeline
          </span>
          <a
            href="/analyze"
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-ground hover:brightness-110"
          >
            + Add deal
          </a>
        </div>
      </header>

      <div className="flex flex-1 gap-3 overflow-x-auto p-4">
        {COLUMNS.map((col) => {
          const colDeals = deals.filter((d) => d.status === col.id);
          const collapsed = col.id === "passed" && !showPassed;
          return (
            <section
              key={col.id}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(col.id);
              }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => onDrop(e, col.id)}
              className={`flex ${collapsed ? "w-10" : "w-60"} shrink-0 flex-col rounded-xl transition-colors ${
                dragOver === col.id ? "bg-raised/70" : "bg-surface/50"
              }`}
            >
              {collapsed ? (
                <button
                  onClick={() => setShowPassed(true)}
                  className="flex h-full flex-col items-center gap-2 py-3 text-[11px] font-semibold uppercase tracking-wider text-faint hover:text-mut"
                  title="Show passed deals"
                >
                  <span className="num rounded bg-raised px-1.5">{colDeals.length}</span>
                  <span style={{ writingMode: "vertical-rl" }}>{col.label}</span>
                </button>
              ) : (
                <>
                  <div className="flex items-center justify-between px-3 pb-1 pt-3">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-mut">
                      {col.label}
                    </span>
                    <span className="num rounded bg-raised px-1.5 text-[11px] text-faint">
                      {colDeals.length}
                    </span>
                  </div>
                  {col.id === "passed" && (
                    <button
                      onClick={() => setShowPassed(false)}
                      className="px-3 pb-1 text-left text-[11px] text-faint hover:text-mut"
                    >
                      collapse ‹
                    </button>
                  )}
                  <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2">
                    {colDeals.map((deal) => (
                      <DealCard
                        key={deal.id}
                        deal={deal}
                        onOpen={setOpen}
                        onDragStart={onDragStart}
                      />
                    ))}
                    {colDeals.length === 0 && (
                      <div className="rounded-lg border border-dashed border-line/60 py-6 text-center text-[11px] text-faint">
                        drop here
                      </div>
                    )}
                  </div>
                </>
              )}
            </section>
          );
        })}
      </div>

      {open && (
        <DealModal
          deal={open}
          onClose={() => setOpen(null)}
          onSave={patchDeal}
          onDelete={deleteDeal}
        />
      )}
    </div>
  );
}
