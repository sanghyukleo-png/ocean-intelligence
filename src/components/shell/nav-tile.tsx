import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { NavItem } from "@/lib/nav";
import { cn } from "@/lib/utils";

// "use client" 없이 둔다: 서버 컴포넌트(404 등)와 클라이언트 컴포넌트(메가메뉴·모바일 시트) 모두에서 렌더 가능.
// NavItem.icon은 함수라 클라이언트 경계로 props 직렬화가 안 되므로, 이 파일이 경계가 되지 않게 하는 것이 핵심.

/** 메가메뉴·⌘K·404에서 쓰는 도구 한 칸: 아이콘 + 이름 + 한 줄 설명 (+ 준비 중 배지) */
export function NavTile({
  item,
  onNavigate,
  active,
  className,
}: {
  item: NavItem;
  onNavigate?: () => void;
  active?: boolean;
  className?: string;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex min-h-11 items-start gap-3 rounded-lg p-3 transition-colors hover:bg-subtle focus-visible:bg-subtle",
        active && "bg-subtle",
        className
      )}
    >
      <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-inset text-fg-muted transition-colors group-hover:text-accent">
        <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-medium text-fg">{item.label}</span>
          {item.status === "soon" && <Badge>준비 중</Badge>}
        </span>
        <span className="mt-1 block text-[0.8125rem] leading-snug text-fg-muted">{item.description}</span>
      </span>
    </Link>
  );
}
