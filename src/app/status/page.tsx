import type { Metadata } from "next";
import { connection } from "next/server";
import { PageHeader } from "@/components/shell/page-header";
import { PageShell } from "@/components/shell/page-shell";
import { Badge, formatKst } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SimpleTable } from "@/components/ui/simple-table";
import { HEALTH_LABEL, overallOf, readSourceRows, type Health } from "@/lib/ingest/health";
import { refreshInBackground } from "@/lib/ingest/background";
import { getStore } from "@/lib/store";

export const metadata: Metadata = {
  title: "데이터 수집 상태",
  description: "소스별 마지막 성공 시각, 연속 실패 횟수, 응답 시간과 API 키 설정 여부",
};

const TONE: Record<Health, "up" | "warn" | "down" | "info" | "neutral"> = {
  ok: "up",
  delayed: "warn",
  failed: "down",
  waiting: "info",
  nokey: "neutral",
  "needs-spec": "neutral",
  blocked: "neutral",
};

const OVERALL_LABEL = { ok: "정상", delayed: "지연", failed: "실패 있음", unconfigured: "수집 중인 소스 없음" } as const;

function ago(iso: string | null, now: Date) {
  if (!iso) return "—";
  const min = Math.round((now.getTime() - new Date(iso).getTime()) / 60000);
  const rel = min < 1 ? "방금" : min < 60 ? `${min}분 전` : min < 1440 ? `${Math.round(min / 60)}시간 전` : `${Math.round(min / 1440)}일 전`;
  return `${formatKst(iso)} · ${rel}`;
}

export default async function StatusPage() {
  await connection();
  const now = new Date();
  const store = getStore({ fresh: true });
  const rows = await readSourceRows(store, process.env, now);
  refreshInBackground();
  const overall = overallOf(rows.map((r) => r.health));
  const scheduler = process.env.CRON_SECRET ? "외부 스케줄러 인증 설정됨" : "외부 스케줄러 미설정 — 요청 시 갱신만 동작";

  return (
    <PageShell>
      <PageHeader
        eyebrow="SYSTEM · DATA STATUS"
        title="데이터 수집 상태"
        description="소스마다 마지막 성공 시각, 연속 실패, 응답 시간을 그대로 보여줍니다. 실패한 지표는 화면에서 마지막 성공값과 실패 표시로 바뀝니다."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="type-label text-fg-label">전체</p>
          <p className="mt-2 text-lg font-semibold text-fg">{OVERALL_LABEL[overall]}</p>
        </Card>
        <Card className="p-4">
          <p className="type-label text-fg-label">저장소</p>
          <p className="mt-2 text-sm text-fg">{store.kind === "supabase" ? "Supabase (Postgres)" : "메모리 — 임시"}</p>
          {store.kind === "memory" && (
            <p className="mt-1 text-xs leading-relaxed text-fg-muted">SUPABASE_URL·SUPABASE_SECRET_KEY 미설정. 서버 인스턴스가 바뀌면 이력이 사라집니다.</p>
          )}
        </Card>
        <Card className="p-4">
          <p className="type-label text-fg-label">스케줄</p>
          <p className="mt-2 text-sm text-fg">{scheduler}</p>
          <p className="mt-1 text-xs leading-relaxed text-fg-muted">화면 요청 시 기한이 지난 소스만 수집합니다(소스별 최소 간격).</p>
        </Card>
      </div>

      <SimpleTable
        caption="소스별 수집 상태"
        headers={["소스", "상태", "마지막 성공", "연속 실패", "응답", "최근 오류 · 사유", "다음 수집", "발표 주기", "약관"]}
        numeric={[3, 4]}
        rows={rows.map((r) => ({
          key: r.def.id,
          cells: [
            <span key="n" className="block min-w-40">
              <a href={r.def.sourceUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-fg underline decoration-line-strong underline-offset-2 hover:decoration-fg">
                {r.def.name}
              </a>
              <span className="mt-1 block text-xs text-fg-muted">{r.def.provides.join(" · ")}</span>
            </span>,
            <Badge key="s" tone={TONE[r.health]} dot={r.health === "ok" || r.health === "failed" || r.health === "delayed"} className={TONE[r.health] === "neutral" ? "border-dashed" : undefined}>
              {HEALTH_LABEL[r.health]}
            </Badge>,
            <span key="t" className="num whitespace-nowrap text-fg-muted">{ago(r.status.lastSuccessAt, now)}</span>,
            r.def.availability === "ready" ? r.status.consecutiveFailures : "—",
            r.status.lastDurationMs !== null ? `${(r.status.lastDurationMs / 1000).toFixed(1)}s` : "—",
            <span key="e" className="block min-w-56 text-xs leading-relaxed text-fg-muted">
              {r.health === "nokey" ? (
                <>
                  <span className="num text-fg">{r.missing.join(", ")}</span> 미설정
                  {r.def.keyHelp && <span className="block">{r.def.keyHelp}</span>}
                </>
              ) : r.def.availability !== "ready" ? (
                r.def.note
              ) : r.status.lastError ? (
                <>
                  {r.status.lastError.message}
                  <span className="num block">{formatKst(r.status.lastError.at)}</span>
                </>
              ) : (
                "—"
              )}
            </span>,
            <span key="x" className="num whitespace-nowrap text-fg-muted">{r.health === "nokey" || r.def.availability !== "ready" ? "—" : r.nextAt ? formatKst(r.nextAt) : "다음 요청 시"}</span>,
            <span key="c" className="block min-w-32 text-xs text-fg-muted">{r.def.cadence}</span>,
            <span key="m" className="block min-w-40 text-xs text-fg-muted">{r.def.terms}</span>,
          ],
        }))}
      />
      <p className="mt-4 text-xs leading-relaxed text-fg-muted">
        API 키 값은 어디에도 표시하지 않습니다. 소스 선정·약관 검토 근거는 저장소의 docs/data-sources.md에 있습니다.
      </p>
    </PageShell>
  );
}
