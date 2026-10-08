import { DataBadge, formatKst } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AIS_GATES } from "@/data/geo/aisAreas";
import { LENGTH_BUCKETS } from "@/lib/ais/aggregate";
import type { Feed } from "@/lib/portRisk";
import type { AisGatesSnapshot } from "@/lib/sources/aisstream";

/**
 * 초크포인트 탱커 통과 현황(지시서 11.3) — 개별 선박이 아니라 집계 척수.
 * 육상 AIS 수신 범위 기준이라 원양·일부 해역은 빈다. 선종은 AIS 선종 코드 80–89, 크기는 AIS 치수 기준 추정.
 */
export function ChokepointCard({ feed }: { feed: Feed<AisGatesSnapshot> }) {
  const badge =
    feed.state === "ok" ? (
      <DataBadge grade="live" source="aisstream.io" sourceUrl="https://aisstream.io/" asOf={feed.asOf} fetchedAt={feed.fetchedAt} cadence="수집 창 집계" />
    ) : feed.state === "failed" ? (
      <DataBadge grade="stale" source="aisstream.io" fetchedAt={feed.lastSuccessAt ?? undefined} error={feed.error} />
    ) : feed.state === "nokey" ? (
      <DataBadge grade="nokey" source="aisstream.io" error="AISSTREAM_API_KEY 미설정" />
    ) : (
      <DataBadge grade="pending" />
    );

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-fg">초크포인트 탱커 통과</h3>
        {badge}
      </div>
      {feed.state === "ok" ? (
        <>
          <ul role="list" className="mt-4 grid gap-4 sm:grid-cols-3">
            {AIS_GATES.map((gate) => {
              const c = feed.data.gates.find((g) => g.gateId === gate.id);
              return (
                <li key={gate.id} className="rounded-lg border border-line bg-inset p-3">
                  <p className="text-[0.8125rem] font-medium text-fg">{gate.name}</p>
                  <dl className="mt-2 space-y-1 text-xs text-fg-muted">
                    {gate.directions.map((d) => (
                      <div key={d.id} className="flex justify-between gap-3">
                        <dt>{d.label}</dt>
                        <dd className="num text-fg">{c?.underway[d.id] ?? 0}척</dd>
                      </div>
                    ))}
                    <div className="flex justify-between gap-3">
                      <dt>저속·정박</dt>
                      <dd className="num text-fg">{c?.slow ?? 0}척</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>선종 미확인</dt>
                      <dd className="num">{c?.unknownType ?? 0}척</dd>
                    </div>
                  </dl>
                  {c && Object.keys(c.byLength).length > 0 && (
                    <p className="mt-2 text-xs text-fg-muted">
                      길이(추정){" "}
                      {LENGTH_BUCKETS.filter((b) => c.byLength[b.id]).map((b) => `${b.label} ${c.byLength[b.id]}`).join(" · ")}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs leading-relaxed text-fg-muted">
            {feed.data.windowSec}초 수집 창 · 메시지 {feed.data.messages.toLocaleString("en-US")}건 · {formatKst(feed.fetchedAt)} 수집. 육상 AIS 수신 범위
            기준이며 해협 상자는 본 사이트가 정한 집계 범위입니다.
          </p>
        </>
      ) : (
        <p className="mt-3 text-[0.8125rem] leading-relaxed text-fg-muted">
          호르무즈 · 싱가포르 해협 · 대한해협의 방향별 탱커 척수를 실제 AIS 수신으로 집계합니다.{" "}
          {feed.state === "nokey" ? "AIS 스트림 API 키를 연결하면 표시됩니다." : feed.state === "failed" ? `수집 실패 — ${feed.error}` : ""}
        </p>
      )}
    </Card>
  );
}
