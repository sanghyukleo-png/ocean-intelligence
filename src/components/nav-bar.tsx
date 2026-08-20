"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Anchor } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/market", label: "시황" },
  { href: "/vessels", label: "선박" },
  { href: "/compare", label: "비교" },
  { href: "/opportunities", label: "영업기회" },
  { href: "/analytics", label: "분석" },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded bg-accent/15 text-accent">
            <Anchor size={16} strokeWidth={2.25} />
          </span>
          <span className="text-sm font-semibold tracking-[0.14em] text-foreground">
            OCEAN INTELLIGENCE
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded px-3 py-1.5 text-xs font-medium tracking-wide transition-colors",
                  active
                    ? "bg-surface-2 text-accent"
                    : "text-muted hover:bg-surface hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/about"
            className="hidden text-xs text-muted hover:text-foreground sm:block"
          >
            소개
          </Link>
          <span className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-[10px] font-medium tracking-wide text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-warning" />
            데모 환경
          </span>
        </div>
      </div>
    </header>
  );
}
