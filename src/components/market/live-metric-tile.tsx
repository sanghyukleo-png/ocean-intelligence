import { Card } from "@/components/ui/card";
import { Stat } from "@/components/ui/stat";
import { DataBadge, ProvenanceLine } from "@/components/ui/badge";
import { Sparkline } from "@/components/market/sparkline";
import type { MetricDef, MetricReading } from "@/lib/data/read";

/**
 * 수집 지표 타일: 값 · 직전 발표 대비 · 등급 배지 · 출처 한 줄(원천 기준·수집 시각·발표 주기) · 최근 추이.
 * 값이 없으면 "—"와 상태(키 미설정·수집 실패·소스 검토 중)를 그대로 보여준다.
 */
export function LiveMetricTile({ def, reading }: { def: MetricDef; reading: MetricReading }) {
  const series = reading.series.map((o) => o.value);
  return (
    <Card className="flex h-full flex-col">
      <Stat
        label={def.label}
        value={reading.value}
        format={{ decimals: def.decimals }}
        unit={def.unit}
        delta={reading.changePct}
        deltaFormat={{ decimals: 2, suffix: "%", signed: true }}
        positiveIsGood={null}
        hint={reading.changePct !== null ? "직전 발표 대비" : undefined}
        badge={<DataBadge grade={reading.grade} {...reading.provenance} />}
      />
      {series.length >= 3 && (
        <Sparkline className="mt-4" data={series} label={def.label} format={{ decimals: def.decimals }} unit={def.unit} />
      )}
      <ProvenanceLine grade={reading.grade} {...reading.provenance} className="mt-auto pt-4" />
    </Card>
  );
}
