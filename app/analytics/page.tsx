import { readDb } from "@/lib/store";
import { money } from "@/lib/board";

export const dynamic = "force-dynamic";

export default function AnalyticsPage() {
  const { deals } = readDb();

  const purchased = deals.filter((d) => d.status === "purchased" && d.purchasePrice);
  const sold = deals.filter((d) => d.status === "sold" && d.purchasePrice && d.salePrice);

  const invested = purchased.reduce((s, d) => s + (d.purchasePrice ?? 0), 0);
  const inventoryValue = purchased.reduce((s, d) => s + (d.estValue ?? 0), 0);
  const realized = sold.reduce((s, d) => s + ((d.salePrice ?? 0) - (d.purchasePrice ?? 0)), 0);
  const totalCost = sold.reduce((s, d) => s + (d.purchasePrice ?? 0), 0);
  const roi = totalCost > 0 ? Math.round((realized / totalCost) * 100) : 0;
  const avgBuy = sold.length ? Math.round(sold.reduce((s, d) => s + (d.purchasePrice ?? 0), 0) / sold.length) : 0;
  const avgSell = sold.length ? Math.round(sold.reduce((s, d) => s + (d.salePrice ?? 0), 0) / sold.length) : 0;

  const bestFlips = [...sold]
    .sort(
      (a, b) =>
        (b.salePrice ?? 0) - (b.purchasePrice ?? 0) - ((a.salePrice ?? 0) - (a.purchasePrice ?? 0))
    )
    .slice(0, 5);

  const tiles: { label: string; value: string; tone?: string; sub?: string }[] = [
    { label: "Invested (inventory)", value: money(invested), sub: `${purchased.length} items held` },
    { label: "Inventory resale value", value: money(inventoryValue), sub: `${money(inventoryValue - invested)} unrealized` },
    { label: "Realized profit", value: `+${money(realized)}`, tone: "text-buy", sub: `${sold.length} flips completed` },
    { label: "Average ROI", value: `${roi}%`, tone: roi > 0 ? "text-buy" : "text-pass", sub: "on completed flips" },
    { label: "Avg purchase price", value: money(avgBuy) },
    { label: "Avg selling price", value: money(avgSell) },
  ];

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-lg font-semibold text-ink">Analytics</h1>
      <p className="mb-6 text-sm text-mut">
        Computed from board actuals — the Paid / Sold-for fields on each deal.
        Every sale you record also feeds the price database in production.
      </p>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-xl border border-line bg-surface p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-faint">
              {t.label}
            </div>
            <div className={`num mt-1 text-2xl font-bold ${t.tone ?? "text-ink"}`}>
              {t.value}
            </div>
            {t.sub && <div className="mt-0.5 text-[11px] text-mut">{t.sub}</div>}
          </div>
        ))}
      </div>

      <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-faint">
        Best flips
      </h2>
      <div className="overflow-hidden rounded-xl border border-line">
        <div className="grid grid-cols-[1fr_90px_90px_90px] gap-2 border-b border-line bg-surface px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-faint">
          <span>Deal</span>
          <span className="text-right">Paid</span>
          <span className="text-right">Sold</span>
          <span className="text-right">Profit</span>
        </div>
        {bestFlips.map((d) => {
          const profit = (d.salePrice ?? 0) - (d.purchasePrice ?? 0);
          return (
            <div
              key={d.id}
              className="grid grid-cols-[1fr_90px_90px_90px] items-center gap-2 border-b border-line bg-ground/40 px-4 py-2.5 last:border-b-0"
            >
              <span className="truncate text-sm text-ink">{d.title}</span>
              <span className="num text-right text-sm text-mut">{money(d.purchasePrice)}</span>
              <span className="num text-right text-sm text-mut">{money(d.salePrice)}</span>
              <span className="num text-right text-sm font-bold text-buy">+{money(profit)}</span>
            </div>
          );
        })}
        {bestFlips.length === 0 && (
          <div className="bg-ground/40 py-8 text-center text-sm text-faint">
            No completed flips yet — record Paid and Sold-for on a deal.
          </div>
        )}
      </div>
    </div>
  );
}
