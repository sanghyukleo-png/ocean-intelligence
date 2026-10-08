"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// 헤더의 작은 데이터 상태 점(지시서 11.2) → /status. 페이지는 정적으로 두고 유휴 시간에 요약만 받아 온다.

type Overall = "ok" | "delayed" | "failed" | "unconfigured";
interface Summary {
  overall: Overall;
  counts: { ok: number; delayed: number; failed: number; nokey: number; unavailable: number };
}

const META: Record<Overall | "loading", { label: string; dot: string }> = {
  loading: { label: "데이터 상태 확인 중", dot: "bg-fg-faint" },
  ok: { label: "데이터 수집 정상", dot: "bg-up" },
  delayed: { label: "데이터 수집 지연", dot: "bg-warn" },
  failed: { label: "데이터 수집 실패 있음", dot: "bg-down" },
  unconfigured: { label: "수집 중인 소스 없음 — API 키 미설정", dot: "border border-fg-faint bg-transparent" },
};

export function StatusDot() {
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetch("/api/status")
        .then((r) => (r.ok ? r.json() : null))
        .then((s: Summary | null) => !cancelled && s && setSummary(s))
        .catch(() => {});
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1500));
    const handle = idle(load);
    const timer = window.setInterval(load, 5 * 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      if (window.cancelIdleCallback && typeof handle === "number") window.cancelIdleCallback(handle);
    };
  }, []);

  const meta = META[summary?.overall ?? "loading"];
  const c = summary?.counts;
  const detail = c ? ` · 정상 ${c.ok} · 지연 ${c.delayed} · 실패 ${c.failed} · 키 미설정 ${c.nokey}` : "";

  return (
    <Link
      href="/status"
      aria-label={`${meta.label}${detail} — 수집 상태 보기`}
      title={`${meta.label}${detail}`}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-subtle hover:text-fg"
    >
      <span aria-hidden="true" className={cn("h-2 w-2 rounded-full", meta.dot)} />
    </Link>
  );
}
