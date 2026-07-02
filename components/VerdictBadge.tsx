import type { Verdict } from "@/lib/types";
import { VERDICT_LABEL } from "@/lib/board";

const STYLES: Record<Verdict, string> = {
  buy: "bg-buy/15 text-buy",
  good: "bg-good/15 text-good",
  negotiate: "bg-nego/15 text-nego",
  pass: "bg-pass/15 text-pass",
};

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wider ${STYLES[verdict]}`}
    >
      {VERDICT_LABEL[verdict]}
    </span>
  );
}

export function ScoreChip({ score }: { score: number }) {
  const tone =
    score >= 80 ? "text-buy border-buy/40" : score >= 60 ? "text-good border-good/40" : score >= 40 ? "text-nego border-nego/40" : "text-pass border-pass/40";
  return (
    <span className={`num rounded border px-1.5 py-0.5 text-[11px] font-semibold ${tone}`}>
      {score}
    </span>
  );
}
