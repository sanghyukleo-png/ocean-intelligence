"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChartLine, Ellipsis, FileScan, House, Layers, type LucideIcon } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { NavTile } from "@/components/shell/nav-tile";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { ABOUT_ITEM, MARKET_ITEM, OPS_TOOLS, SHIPBUILDING_ITEMS, VESSEL_ITEMS, VOYAGE_ITEM, isActive } from "@/lib/nav";
import { cn } from "@/lib/utils";

type SheetKind = "ops" | "more" | null;

function TabButton({
  icon: Icon,
  label,
  active,
  href,
  onClick,
  expanded,
}: {
  icon: LucideIcon;
  label: string;
  active: boolean;
  href?: string;
  onClick?: () => void;
  expanded?: boolean;
}) {
  const className = cn(
    "relative flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-[0.6875rem] font-medium transition-colors",
    active ? "text-fg" : "text-fg-label"
  );
  const content = (
    <>
      {active && <span aria-hidden="true" className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-accent" />}
      <Icon size={20} strokeWidth={1.75} aria-hidden="true" className={active ? "text-accent" : undefined} />
      {label}
    </>
  );
  return href ? (
    <Link href={href} aria-current={active ? "page" : undefined} className={className}>
      {content}
    </Link>
  ) : (
    <button type="button" onClick={onClick} aria-haspopup="dialog" aria-expanded={expanded} className={className}>
      {content}
    </button>
  );
}

/** 모바일 하단 탭 5개 (지시서 4.2) */
export function MobileTabBar() {
  const pathname = usePathname();
  const [sheet, setSheet] = useState<SheetKind>(null);
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setSheet(null);
  }

  const opsActive = isActive(pathname, OPS_TOOLS.map((t) => t.href));
  const moreItems = [VOYAGE_ITEM, VESSEL_ITEMS[1], ...SHIPBUILDING_ITEMS, ABOUT_ITEM];
  const moreActive = isActive(pathname, moreItems.map((t) => t.href));

  return (
    <>
      <nav
        aria-label="하단 메뉴"
        data-print-hidden
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-[color-mix(in_oklab,var(--bg)_88%,transparent)] pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      >
        <div className="mx-auto flex max-w-lg">
          <TabButton icon={House} label="홈" href="/" active={pathname === "/"} />
          <TabButton
            icon={Layers}
            label="오퍼레이션"
            active={opsActive}
            expanded={sheet === "ops"}
            onClick={() => setSheet("ops")}
          />
          <TabButton icon={FileScan} label="선박" href={VESSEL_ITEMS[0].href} active={isActive(pathname, ["/vessels"])} />
          <TabButton icon={ChartLine} label="시황" href={MARKET_ITEM.href} active={isActive(pathname, [MARKET_ITEM.href])} />
          <TabButton
            icon={Ellipsis}
            label="더보기"
            active={moreActive}
            expanded={sheet === "more"}
            onClick={() => setSheet("more")}
          />
        </div>
      </nav>

      <Sheet open={sheet === "ops"} onOpenChange={(o) => !o && setSheet(null)} title="오퍼레이션 도구">
        <div className="-mx-2 grid gap-1">
          {OPS_TOOLS.map((item) => (
            <NavTile key={item.href} item={item} active={isActive(pathname, [item.href])} onNavigate={() => setSheet(null)} />
          ))}
        </div>
      </Sheet>

      <Sheet open={sheet === "more"} onOpenChange={(o) => !o && setSheet(null)} title="더보기">
        <div className="-mx-2 grid gap-1">
          {moreItems.map((item) => (
            <NavTile key={item.href} item={item} active={isActive(pathname, [item.href])} onNavigate={() => setSheet(null)} />
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
          <span className="text-sm text-fg-muted">테마</span>
          <ThemeToggle />
        </div>
      </Sheet>
    </>
  );
}
