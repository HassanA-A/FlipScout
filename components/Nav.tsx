"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/client";

const LINKS = [
  { href: "/", label: "Board" },
  { href: "/analyze", label: "Analyze" },
  { href: "/watchlists", label: "Watchlists" },
  { href: "/prices", label: "Prices" },
  { href: "/analytics", label: "Analytics" },
];

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/auth") return null;

  async function signOut() {
    try {
      const sb = createSupabaseBrowser();
      await sb.auth.signOut();
    } finally {
      router.push("/auth");
      router.refresh();
    }
  }

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
      <div className="mt-auto flex flex-col gap-3 px-2">
        <button
          onClick={signOut}
          className="rounded-md border border-line px-3 py-1.5 text-left text-[12px] text-mut transition-colors hover:bg-raised hover:text-ink"
        >
          Sign out
        </button>
        <div className="text-[11px] leading-relaxed text-faint">
          Prototype build.
          <br />
          Supabase · alias engine.
        </div>
      </div>
    </aside>
  );
}
