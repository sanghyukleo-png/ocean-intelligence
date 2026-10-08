import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DataBadge, formatKst } from "@/components/ui/badge";
import type { PortRiskBoard } from "@/lib/data/read";
import { RISK_LEVELS } from "@/lib/tokens";
import { cn } from "@/lib/utils";

/**
 * "오늘의 국내항" 스트립(지시서 11.4): 주의 이상 항만만 보여주고, 없으면 "전 항만 정상 · 발표 시각".
 * 특보를 수집하지 못하면 등급을 표시하지 않는다 — 미수집을 "정상"으로 보이게 하지 않는다.
 */
export function KoreaPortStrip({ board, className }: { board: PortRiskBoard; className?: string }) {
  const w = board.warnings;
  const flagged = board.ports.filter((p) => (p.level ?? 0) >= 2).sort((a, b) => (b.level ?? 0) - (a.level ?? 0));

  let badge: React.ReactNode;
  let body: React.ReactNode;
  if (w.state === "ok") {
    badge = <DataBadge grade="live" source="기상청" asOf={w.asOf} fetchedAt={w.fetchedAt} cadence="특보 수시 발표" />;
    body = flagged.length ? (
      <span className="flex flex-wrap gap-x-3 gap-y-1">
        {flagged.map((p) => {
          const r = RISK_LEVELS[p.level!];
          return (
            <span key={p.portId} className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: `var(${r.token})` }} />
              <span className="text-fg">{p.name}</span>
              <span>{r.label}</span>
            </span>
          );
        })}
      </span>
    ) : (
      <>전 항만 정상 · 특보 현황 {formatKst(w.asOf)} 기준</>
    );
  } else if (w.state === "failed") {
    badge = <DataBadge grade="stale" source="기상청" fetchedAt={w.lastSuccessAt ?? undefined} error={w.error} />;
    body = <>특보 수집 실패 — 등급을 표시하지 않습니다{w.lastSuccessAt ? ` · 마지막 성공 ${formatKst(w.lastSuccessAt)}` : ""}</>;
  } else if (w.state === "nokey") {
    badge = <DataBadge grade="nokey" source="기상청" error="KMA_DATA_GO_KR_KEY 미설정" />;
    body = <>울산·온산 · 여수·광양 · 대산 · 인천 외 8개 항 — 기상청 API 키 연결 후 등급 산출</>;
  } else {
    badge = <DataBadge grade="pending" source="기상청" />;
    body = <>울산·온산 · 여수·광양 · 대산 · 인천 외 8개 항</>;
  }

  return (
    <Link
      href="/ops/weather"
      data-spotlight=""
      className={cn("surface-card group flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between", className)}
    >
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-fg">오늘의 국내항</span>
          {badge}
        </span>
        <span className="mt-2 block text-[0.8125rem] text-fg-muted">{body}</span>
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
