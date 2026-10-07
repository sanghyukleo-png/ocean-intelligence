import type { MarketIndicator } from "@/types";
import { Card } from "@/components/ui/card";
import { Stat } from "@/components/ui/stat";
import { DataBadge } from "@/components/ui/badge";
import { Sparkline } from "@/components/market/sparkline";

/**
 * 시황 지표 스탯 타일: 라벨 · 값+단위 · 변동률(방향 아이콘+부호) · 스파크라인 · 설명.
 * 예시 데이터라 모든 값에 DEMO 배지. 변동률은 중립색(positiveIsGood=null) — 좋고 나쁨을 단정하지 않는다.
 */
export function MarketStatTile({ indicator }: { indicator: MarketIndicator }) {
  const decimals = [indicator.value, ...indicator.sparkline].some((v) => !Number.isInteger(v)) ? 1 : 0;

  return (
    <Card className="flex h-full flex-col">
      <Stat
        label={indicator.label}
        value={indicator.value}
        format={{ decimals }}
        unit={indicator.unit}
        delta={indicator.changePct}
        positiveIsGood={null}
        badge={<DataBadge grade="demo" />}
      />
      <Sparkline
        className="mt-4"
        data={indicator.sparkline}
        label={indicator.label}
        format={{ decimals }}
        unit={indicator.unit}
      />
      {indicator.description && (
        <p className="mt-4 text-[0.8125rem] leading-relaxed text-fg-muted">{indicator.description}</p>
      )}
    </Card>
  );
}
