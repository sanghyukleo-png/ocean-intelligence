import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DataBadge } from "@/components/ui/badge";
import { RISK_LEVELS } from "@/lib/tokens";
import { cn } from "@/lib/utils";

/**
 * "오늘의 국내항" 스트립(지시서 11.4): 주의 이상 항만만 보여주고, 없으면 "전 항만 정상 · 발표 시각".
 * 기상청 연동(Phase 2.5) 전에는 등급을 표시하지 않는다 — 미수집을 "정상"으로 보이게 하지 않는다.
 */
export function KoreaPortStrip({ className }: { className?: string }) {
  return (
    <Link
      href="/ops/weather"
      data-spotlight=""
      className={cn("surface-card group flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between", className)}
    >
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-fg">오늘의 국내항</span>
          <DataBadge grade="pending" source="기상청" cadence="특보 수시 · 해상예보 일 2~8회" />
        </span>
        <span className="mt-2 block text-[0.8125rem] text-fg-muted">
          울산·온산 · 여수·광양 · 대산 · 인천 외 8개 항 · 클로징 위험 5단계
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-3">
        <span aria-hidden="true" className="flex gap-1">
          {RISK_LEVELS.map((r) => (
            <span key={r.level} className="h-1.5 w-4 rounded-full" style={{ background: `var(${r.token})` }} title={r.label} />
          ))}
        </span>
        <ArrowRight size={15} aria-hidden="true" className="text-fg-faint transition-colors group-hover:text-fg" />
      </span>
    </Link>
  );
}
