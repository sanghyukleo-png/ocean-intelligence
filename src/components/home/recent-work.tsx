"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { History } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { formatKst } from "@/components/ui/badge";
import { readRecentWork, type RecentWork } from "@/lib/recent-work";

// localStorage 스냅샷 구독 — 같은 탭(커스텀 이벤트)과 다른 탭(storage) 변경을 모두 반영
let cache: { raw: string | null; list: RecentWork[] } = { raw: null, list: [] };
function snapshot(): RecentWork[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem("oi-recent-work");
  } catch {}
  if (raw !== cache.raw) cache = { raw, list: readRecentWork() };
  return cache.list;
}
const EMPTY: RecentWork[] = [];
function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener("oi:recent-work", cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener("oi:recent-work", cb);
  };
}

export function useRecentWork() {
  return useSyncExternalStore(subscribe, snapshot, () => EMPTY);
}

/** 도구 카드의 "마지막 계산값" 미니 프리뷰 */
export function LastResult({ tool, fallback }: { tool: string; fallback: React.ReactNode }) {
  const list = useRecentWork();
  const last = list.find((r) => r.tool === tool);
  if (!last) return <>{fallback}</>;
  return (
    <span className="block truncate">
      <span className="num text-fg">{last.summary}</span>
      <span className="ml-2 text-fg-muted">{formatKst(last.at)}</span>
    </span>
  );
}

export function RecentWorkList({ limit = 5 }: { limit?: number }) {
  const list = useRecentWork().slice(0, limit);
  if (!list.length) {
    return (
      <EmptyState
        icon={History}
        title="최근 계산이 없습니다"
        description="계산기 결과는 이 브라우저에만 저장되고, 여기와 ⌘K에서 다시 열 수 있습니다."
      />
    );
  }
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-raised">
      {list.map((r) => (
        <li key={r.id}>
          <Link href={r.href} className="flex min-h-14 items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-subtle">
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-fg">{r.title}</span>
              <span className="num block truncate text-xs text-fg-muted">{r.summary}</span>
            </span>
            <span className="num shrink-0 text-xs text-fg-muted">{formatKst(r.at)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
