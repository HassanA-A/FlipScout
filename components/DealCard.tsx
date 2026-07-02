"use client";

import type { Deal } from "@/lib/types";
import { SOURCE_LABEL, money, timeAgo } from "@/lib/board";
import { ScoreChip, VerdictBadge } from "./VerdictBadge";

const STRIPE: Record<string, string> = {
  buy: "border-l-buy",
  good: "border-l-good",
  negotiate: "border-l-nego",
  pass: "border-l-pass",
};

export function DealCard({
  deal,
  onOpen,
  onDragStart,
}: {
  deal: Deal;
  onOpen: (deal: Deal) => void;
  onDragStart: (e: React.DragEvent, deal: Deal) => void;
}) {
  const profit = deal.estProfit ?? 0;
  return (
    <button
      draggable
      onDragStart={(e) => onDragStart(e, deal)}
      onClick={() => onOpen(deal)}
      className={`w-full cursor-grab rounded-lg border border-line border-l-[3px] bg-surface p-3 text-left transition-colors hover:border-line hover:bg-raised active:cursor-grabbing ${
        STRIPE[deal.verdict ?? "pass"]
      }`}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="num text-sm">
          <span className="font-bold text-ink">{money(deal.askingPrice)}</span>
          <span className="mx-1 text-faint">→</span>
          <span className="text-mut">{money(deal.estValue)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`num text-sm font-bold ${profit > 0 ? "text-buy" : "text-pass"}`}
          >
            {profit >= 0 ? "+" : "−"}
            {money(Math.abs(profit))}
          </span>
          {deal.score !== undefined && <ScoreChip score={deal.score} />}
        </div>
      </div>

      <div className="mb-2 line-clamp-2 text-[13px] leading-snug text-ink">
        {deal.title}
      </div>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-mut">
        {deal.verdict && <VerdictBadge verdict={deal.verdict} />}
        <span className="rounded bg-raised px-1 py-0.5 font-semibold text-faint">
          {SOURCE_LABEL[deal.source]}
        </span>
        {deal.distanceMi !== undefined && deal.distanceMi > 0 && (
          <span className="num">{deal.distanceMi} mi</span>
        )}
        {deal.listedAt && <span>{timeAgo(deal.listedAt)} ago</span>}
        {deal.seller && <span className="truncate">{deal.seller}</span>}
        {deal.notes && <span title={deal.notes}>✎</span>}
      </div>
    </button>
  );
}
