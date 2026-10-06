"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/shell/theme-toggle";
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);

  // 경로가 바뀌면 렌더링 중에 메뉴를 닫습니다 (useEffect 대신 렌더 중 상태 조정 —
  // React가 커밋 전에 다시 렌더링해 불필요한 추가 페인트를 피합니다).
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" aria-label="OCEAN INTELLIGENCE 홈" className="flex items-center rounded-md">
          <Logo className="hidden sm:inline-flex" />
          <Logo compact className="sm:hidden" />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded px-4 py-2 text-sm font-semibold tracking-wide transition-colors",
                  active
                    ? "bg-surface-2 text-accent"
                    : "text-foreground/80 hover:bg-surface hover:text-foreground"
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
          <ThemeToggle />
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "메뉴 닫기" : "메뉴 열기"}
            aria-expanded={menuOpen}
            className="flex h-8 w-8 items-center justify-center rounded border border-border text-foreground md:hidden"
          >
            {menuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="container-page flex flex-col gap-1 border-t border-border py-3 md:hidden">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded px-3 py-2.5 text-base font-semibold tracking-wide transition-colors",
                  active
                    ? "bg-surface-2 text-accent"
                    : "text-foreground/80 hover:bg-surface hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/about"
            className="rounded px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface hover:text-foreground"
          >
            소개
          </Link>
        </nav>
      )}
    </header>
  );
}
