"use client";

import { useState } from "react";
import type { Deal, DealStatus } from "@/lib/types";
import { COLUMNS, money } from "@/lib/board";
import { ScoreChip, VerdictBadge } from "./VerdictBadge";

export function DealModal({
  deal,
  onClose,
  onSave,
  onDelete,
}: {
  deal: Deal;
  onClose: () => void;
  onSave: (id: string, patch: Partial<Deal>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [notes, setNotes] = useState(deal.notes ?? "");
  const [status, setStatus] = useState<DealStatus>(deal.status);
  const [purchasePrice, setPurchasePrice] = useState(deal.purchasePrice?.toString() ?? "");
  const [salePrice, setSalePrice] = useState(deal.salePrice?.toString() ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await onSave(deal.id, {
      notes,
      status,
      purchasePrice: purchasePrice ? Number(purchasePrice) : undefined,
      salePrice: salePrice ? Number(salePrice) : undefined,
    });
    setSaving(false);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl border border-line bg-surface p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 className="text-base font-semibold leading-snug text-ink">{deal.title}</h2>
          <button onClick={onClose} className="text-mut hover:text-ink" aria-label="Close">
            ✕
          </button>
        </div>

        <div className="mb-4 flex items-center gap-3">
          <span className="num text-lg font-bold text-ink">{money(deal.askingPrice)}</span>
          <span className="text-faint">→</span>
          <span className="num text-lg text-mut">{money(deal.estValue)}</span>
          <span
            className={`num text-lg font-bold ${(deal.estProfit ?? 0) > 0 ? "text-buy" : "text-pass"}`}
          >
            {(deal.estProfit ?? 0) >= 0 ? "+" : "−"}{money(Math.abs(deal.estProfit ?? 0))}
          </span>
          {deal.verdict && <VerdictBadge verdict={deal.verdict} />}
          {deal.score !== undefined && <ScoreChip score={deal.score} />}
        </div>

        {deal.reasoning && (
          <p className="mb-4 rounded-lg bg-raised p-3 text-[13px] leading-relaxed text-mut">
            {deal.reasoning}
            {deal.confidence !== undefined && (
              <span className="mt-1 block text-[11px] text-faint">
                Confidence {deal.confidence}%
              </span>
            )}
          </p>
        )}

        {deal.parts && deal.parts.length > 0 && (
          <div className="mb-4">
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-faint">
              Extracted parts
            </div>
            <div className="overflow-hidden rounded-lg border border-line">
              {deal.parts.map((p) => (
                <div
                  key={p.componentId}
                  className="flex items-center justify-between border-b border-line bg-ground/40 px-3 py-1.5 text-[13px] last:border-b-0"
                >
                  <span className="text-ink">{p.name}</span>
                  <span className="num text-mut">{money(p.resaleValue)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-4 grid grid-cols-2 gap-3">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-faint">
            Status
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as DealStatus)}
              className="mt-1 w-full rounded-md border border-line bg-ground px-2 py-1.5 text-sm text-ink"
            >
              {COLUMNS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-faint">
              Paid
              <input
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="—"
                inputMode="decimal"
                className="num mt-1 w-full rounded-md border border-line bg-ground px-2 py-1.5 text-sm text-ink"
              />
            </label>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-faint">
              Sold for
              <input
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                placeholder="—"
                inputMode="decimal"
                className="num mt-1 w-full rounded-md border border-line bg-ground px-2 py-1.5 text-sm text-ink"
              />
            </label>
          </div>
        </div>

        <label className="mb-4 block text-[11px] font-semibold uppercase tracking-wider text-faint">
          Notes
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Pickup details, offer history, gut feeling…"
            className="mt-1 w-full rounded-md border border-line bg-ground px-2 py-1.5 text-sm text-ink placeholder:text-faint"
          />
        </label>

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {deal.url && (
              <a
                href={deal.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-md border border-line px-3 py-1.5 text-sm text-mut hover:text-ink"
              >
                Open listing ↗
              </a>
            )}
            <button
              onClick={async () => {
                await onDelete(deal.id);
                onClose();
              }}
              className="rounded-md border border-pass/30 px-3 py-1.5 text-sm text-pass hover:bg-pass/10"
            >
              Delete
            </button>
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-md bg-accent px-4 py-1.5 text-sm font-semibold text-ground hover:brightness-110 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
