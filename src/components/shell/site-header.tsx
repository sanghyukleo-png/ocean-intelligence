"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { NavTile } from "@/components/shell/nav-tile";
import { openCommandPalette } from "@/components/shell/command-palette";
import { ABOUT_ITEM, TOP_NAV, isActive, type TopNavEntry } from "@/lib/nav";
import { cn } from "@/lib/utils";

function MegaMenu({
  entry,
  pathname,
  open,
  onOpenChange,
}: {
  entry: Extract<TopNavEntry, { kind: "menu" }>;
  pathname: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const panelId = useId();
  const wrapper = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<number | undefined>(undefined);
  const active = isActive(
    pathname,
    entry.items.map((i) => i.href)
  );

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrapper.current?.contains(e.target as Node)) onOpenChange(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
        wrapper.current?.querySelector<HTMLButtonElement>("button")?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onOpenChange]);

  // 마우스: 짧은 지연 후 열고 닫는다(메뉴 사이 이동 중 깜빡임 방지)
  const schedule = (next: boolean) => {
    window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => onOpenChange(next), next ? 80 : 160);
  };

  const wide = entry.items.length > 3;

  return (
    <div
      ref={wrapper}
      className="relative"
      onPointerEnter={(e) => e.pointerType === "mouse" && schedule(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && schedule(false)}
      onBlur={(e) => {
        if (!wrapper.current?.contains(e.relatedTarget as Node)) onOpenChange(false);
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => onOpenChange(!open)}
        className={cn(
          "flex h-9 items-center gap-1 rounded-lg px-3 text-sm font-medium transition-colors",
          active || open ? "text-fg" : "text-fg-muted hover:text-fg"
        )}
      >
        {entry.label}
        <ChevronDown
          size={14}
          strokeWidth={2}
          aria-hidden="true"
          className={cn("transition-transform duration-200", open && "rotate-180")}
        />
        {active && <span aria-hidden="true" className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-accent" />}
      </button>
      <div
        id={panelId}
        hidden={!open}
        className={cn(
          "absolute left-1/2 top-[calc(100%+12px)] z-50 -translate-x-1/2 rounded-xl border border-line-strong bg-raised p-2 shadow-[0_24px_48px_rgb(0_0_0/0.32),inset_0_1px_0_var(--highlight)] motion-safe:animate-[oi-menu-in_200ms_var(--ease-out-expo)_both]",
          wide ? "w-[min(44rem,calc(100vw-2rem))]" : "w-[min(22rem,calc(100vw-2rem))]"
        )}
      >
        <div className={cn("grid gap-1", wide && "grid-cols-2")}>
          {entry.items.map((item) => (
            <NavTile
              key={item.href}
              item={item}
              active={isActive(pathname, [item.href])}
              onNavigate={() => onOpenChange(false)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [lastPath, setLastPath] = useState(pathname);

  // 경로가 바뀌면 렌더 중에 메뉴를 닫는다
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpenMenu(null);
  }

  return (
    <header
      data-print-hidden
      style={{ viewTransitionName: "site-header" }}
      className="sticky top-0 z-40 border-b border-line bg-[color-mix(in_oklab,var(--bg)_82%,transparent)] backdrop-blur-md motion-safe:animate-[oi-fade-in_480ms_var(--ease-out-expo)_120ms_both]"
    >
      <div className="container-page flex h-16 items-center gap-6">
        <Link href="/" aria-label="OCEAN INTELLIGENCE 홈" className="flex shrink-0 items-center rounded-md">
          <Logo className="hidden lg:inline-flex" />
          <Logo compact className="lg:hidden" />
        </Link>

        <nav aria-label="주 메뉴" className="hidden flex-1 items-center gap-1 md:flex">
          {TOP_NAV.map((entry) =>
            entry.kind === "menu" ? (
              <MegaMenu
                key={entry.id}
                entry={entry}
                pathname={pathname}
                open={openMenu === entry.id}
                onOpenChange={(o) => setOpenMenu((cur) => (o ? entry.id : cur === entry.id ? null : cur))}
              />
            ) : (
              <Link
                key={entry.item.href}
                href={entry.item.href}
                aria-current={isActive(pathname, entry.match) ? "page" : undefined}
                className={cn(
                  "relative flex h-9 items-center rounded-lg px-3 text-sm font-medium transition-colors",
                  isActive(pathname, entry.match) ? "text-fg" : "text-fg-muted hover:text-fg"
                )}
              >
                {entry.label}
                {isActive(pathname, entry.match) && (
                  <span aria-hidden="true" className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-accent" />
                )}
              </Link>
            )
          )}
          <Link
            href={ABOUT_ITEM.href}
            aria-current={isActive(pathname, [ABOUT_ITEM.href]) ? "page" : undefined}
            className={cn(
              "relative flex h-9 items-center rounded-lg px-3 text-sm font-medium transition-colors",
              isActive(pathname, [ABOUT_ITEM.href]) ? "text-fg" : "text-fg-muted hover:text-fg"
            )}
          >
            소개
            {isActive(pathname, [ABOUT_ITEM.href]) && (
              <span aria-hidden="true" className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-accent" />
            )}
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={openCommandPalette}
            aria-keyshortcuts="Meta+K Control+K"
            className="flex h-9 items-center gap-2 rounded-lg border border-line bg-inset pl-3 pr-2 text-[0.8125rem] text-fg-muted transition-colors hover:border-line-strong hover:text-fg max-md:w-9 max-md:justify-center max-md:px-0"
          >
            <Search size={15} strokeWidth={1.75} aria-hidden="true" />
            {/* 접근 이름은 "검색" — lg 미만에서는 아이콘만 보이고 글자는 sr-only */}
            <span className="max-lg:sr-only">검색</span>
            <kbd aria-hidden="true" className="hidden rounded-full border border-line-strong px-2 font-mono text-[0.6875rem] leading-5 text-fg-label md:inline">
              ⌘K
            </kbd>
          </button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
