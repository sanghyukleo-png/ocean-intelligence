import type { DataGrade, DataProvenance } from "@/components/ui/badge";
import { METRICS, readMetric, readPortRisks } from "@/lib/data/read";
import type { DataStore } from "@/lib/store";
import type { NumFormat } from "@/lib/utils";

// 홈 라이브 티커(지시서 11.5 순서). 값은 수집 저장소에서 읽는다 — 수집 전·실패·키 없음은 그대로 드러낸다(가짜 값 금지).

export interface TickerItem {
  key: string;
  label: string;
  unit: string;
  value: number | null;
  /** 직전 발표 대비 변화(%) */
  changePct: number | null;
  format: NumFormat;
  grade: DataGrade;
  provenance: DataProvenance;
  /** 상승이 좋은 방향인가(색 결정). 가격 지표는 중립 → null */
  positiveIsGood: boolean | null;
}

const ORDER = ["brent", "dubai", "usdkrw", "vlsfo-sg", "vlsfo-busan", "scfi"] as const;

export async function getTickerItems(store: DataStore, env: Record<string, string | undefined> = process.env): Promise<TickerItem[]> {
  const readings = await Promise.all(ORDER.map((id) => readMetric(store, id, env, 2)));
  const items: TickerItem[] = readings.map((r) => {
    const def = METRICS.find((m) => m.id === r.id)!;
    return {
      key: r.id,
      label: def.label,
      unit: def.unit,
      value: r.value,
      changePct: r.changePct,
      format: { decimals: def.decimals },
      grade: r.grade,
      provenance: r.provenance,
      positiveIsGood: null,
    };
  });

  // 국내항 경보 수 = 위험도 "주의" 이상 항만 수
  const board = await readPortRisks(store, env);
  const w = board.warnings;
  const count = w.state === "ok" ? board.ports.filter((p) => (p.level ?? 0) >= 2).length : null;
  items.push({
    key: "kr-warnings",
    label: "국내항 주의 이상",
    unit: "곳",
    value: count,
    changePct: null,
    format: { decimals: 0 },
    grade: w.state === "ok" ? "live" : w.state === "nokey" ? "nokey" : w.state === "failed" ? "stale" : "pending",
    provenance: {
      source: "기상청",
      sourceUrl: "https://www.weather.go.kr/w/special-report/overall.do",
      cadence: "특보 수시 발표",
      ...(w.state === "ok" ? { asOf: w.asOf, fetchedAt: w.fetchedAt } : {}),
      ...(w.state === "failed" ? { error: w.error, fetchedAt: w.lastSuccessAt ?? undefined } : {}),
      ...(w.state === "nokey" ? { error: "KMA_DATA_GO_KR_KEY 미설정" } : {}),
    },
    positiveIsGood: false,
  });
  return items;
}
