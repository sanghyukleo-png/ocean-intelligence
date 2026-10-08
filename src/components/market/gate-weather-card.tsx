import { DataBadge, formatKst } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AIS_GATES } from "@/data/geo/aisAreas";
import type { Feed } from "@/lib/portRisk";
import type { MetSnapshot } from "@/lib/sources/openMeteo";
import { compass, summarizeMet } from "@/lib/weather/metSummary";
import { formatNum } from "@/lib/utils";

/** 주요 해협 바다 상태 — Open-Meteo 72시간 예보(해협 집계 상자 중심 격자) */
export function GateWeatherCard({ feed }: { feed: Feed<MetSnapshot> }) {
  const badge =
    feed.state === "ok" ? (
      <DataBadge grade="live" source="Open-Meteo" sourceUrl="https://open-meteo.com/" asOf={feed.asOf} fetchedAt={feed.fetchedAt} cadence="모델 갱신 시간별" />
    ) : feed.state === "failed" ? (
      <DataBadge grade="stale" source="Open-Meteo" fetchedAt={feed.lastSuccessAt ?? undefined} error={feed.error} />
    ) : (
      <DataBadge grade="pending" source="Open-Meteo" />
    );
  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-fg">해협 바다 상태 · 72시간</h3>
        {badge}
      </div>
      {feed.state === "ok" ? (
        <>
          <ul role="list" className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {AIS_GATES.map((g) => {
              const p = feed.data.points.find((x) => x.kind === "gate" && x.id === g.id);
              if (!p) return null;
              const s = summarizeMet(p);
              return (
                <li key={g.id} className="rounded-lg border border-line bg-inset p-3">
                  <p className="text-[0.8125rem] font-medium text-fg">{g.name}</p>
                  <dl className="mt-2 space-y-1 text-xs text-fg-muted">
                    <div className="flex justify-between gap-3">
                      <dt>지금 바람</dt>
                      <dd className="num text-fg">
                        {compass(s.now.dirDeg)} {formatNum(s.now.windKt, { decimals: 0 })}kt
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>지금 파고</dt>
                      <dd className="num text-fg">{formatNum(s.now.waveM, { decimals: 1 })}m</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>72h 최대</dt>
                      <dd className="num">
                        {formatNum(s.maxWindKt, { decimals: 0 })}kt · {formatNum(s.maxWaveM, { decimals: 1 })}m
                      </dd>
                    </div>
                  </dl>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs leading-relaxed text-fg-muted">
            {formatKst(feed.data.points[0]?.times[0])}부터 · 해협 상자 중심의 모델 격자 값입니다. 항해·도선 판단은 해당 국가 기상 당국 예보를 확인하십시오. Weather data by
            Open-Meteo.com (CC BY 4.0)
          </p>
        </>
      ) : (
        <p className="mt-3 text-[0.8125rem] text-fg-muted">호르무즈 · 싱가포르 해협 · 대한해협의 바람과 파고 예보를 수집합니다.</p>
      )}
    </Card>
  );
}
