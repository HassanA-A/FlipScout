import { getCatalog } from "./catalog";
import type { Analysis, ExtractedPart, Verdict } from "./types";

/**
 * Deal analysis pipeline (see DESIGN.md §5).
 *
 * Stage 1 EXTRACT here is the deterministic alias fast-path. In production an
 * LLM handles messy text and screenshots when this pass matches poorly — but
 * the LLM only ever *extracts*. Stages 3–4 (value, score) are pure functions
 * over the price database. The LLM never sets a price.
 */

interface Span {
  start: number;
  end: number;
}

function overlaps(a: Span, spans: Span[]): boolean {
  return spans.some((s) => a.start < s.end && s.start < a.end);
}

export function extractParts(
  text: string,
  overrides?: Record<string, { buyValue: number; resaleValue: number }>
): ExtractedPart[] {
  const catalog = getCatalog(overrides);
  const hay = text.toLowerCase();

  // Longest alias wins: "rtx 3060 ti" must claim its span before "3060" can.
  const candidates = catalog
    .flatMap((c) => c.aliases.map((alias) => ({ c, alias })))
    .sort((a, b) => b.alias.length - a.alias.length);

  const claimed: Span[] = [];
  const found = new Map<string, ExtractedPart>();

  for (const { c, alias } of candidates) {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`, "g");
    let m: RegExpExecArray | null;
    while ((m = re.exec(hay)) !== null) {
      const span = { start: m.index, end: m.index + m[0].length };
      if (overlaps(span, claimed)) continue;
      claimed.push(span);
      if (!found.has(c.id)) {
        found.set(c.id, {
          componentId: c.id,
          name: c.name,
          category: c.category,
          qty: 1,
          resaleValue: c.resaleValue,
        });
      }
    }
  }

  return [...found.values()];
}

function verdictFor(marginPct: number): Verdict {
  if (marginPct >= 0.25) return "buy";
  if (marginPct >= 0.1) return "good";
  if (marginPct >= -0.05) return "negotiate";
  return "pass";
}

const VERDICT_LINE: Record<Verdict, string> = {
  buy: "Well below market — move fast.",
  good: "Solid margin at asking price.",
  negotiate: "Thin at asking — worth an offer below list.",
  pass: "Priced at or above what it resells for.",
};

export function analyze(
  text: string,
  askingPrice: number,
  overrides?: Record<string, { buyValue: number; resaleValue: number }>
): Analysis {
  const parts = extractParts(text, overrides);
  const estValue = parts.reduce((sum, p) => sum + p.resaleValue * p.qty, 0);

  if (parts.length === 0 || estValue <= 0) {
    return {
      parts: [],
      estValue: 0,
      estProfit: 0,
      marginPct: 0,
      score: 0,
      verdict: "pass",
      confidence: 10,
      reasoning:
        "No recognizable components found in the listing text. Add the parts to the price database, or review manually.",
    };
  }

  const estProfit = Math.round(estValue - askingPrice);
  const marginPct = (estValue - askingPrice) / estValue;
  const score = Math.max(2, Math.min(99, Math.round(55 + marginPct * 150)));
  const verdict = verdictFor(marginPct);
  const confidence = Math.min(95, 40 + parts.length * 12);

  const partList = parts.map((p) => p.name).join(", ");
  const pct = Math.round(Math.abs(marginPct) * 100);
  const direction = marginPct >= 0 ? "below" : "above";
  const reasoning =
    `Matched ${parts.length} component${parts.length === 1 ? "" : "s"} (${partList}) ` +
    `worth ~$${estValue} resale. Asking $${askingPrice} is ${pct}% ${direction} estimated value. ` +
    VERDICT_LINE[verdict];

  return { parts, estValue, estProfit, marginPct, score, verdict, confidence, reasoning };
}
