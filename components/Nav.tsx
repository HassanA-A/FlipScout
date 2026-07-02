"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Board" },
  { href: "/analyze", label: "Analyze" },
  { href: "/watchlists", label: "Watchlists" },
  { href: "/prices", label: "Prices" },
  { href: "/analytics", label: "Analytics" },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 flex h-screen w-44 shrink-0 flex-col border-r border-line bg-surface px-3 py-5">
      <Link href="/" className="mb-8 flex items-baseline gap-1.5 px-2">
        <span className="text-lg font-bold tracking-tight text-ink">
          Flip<span className="text-accent">Scout</span>
        </span>
      </Link>
      <nav className="flex flex-col gap-1">
        {LINKS.map((l) => {
          const active = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-md px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-raised font-semibold text-accent"
                  : "text-mut hover:bg-raised hover:text-ink"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto px-2 text-[11px] leading-relaxed text-faint">
        Prototype build.
        <br />
        JSON store · alias engine.
      </div>
    </aside>
  );
}
