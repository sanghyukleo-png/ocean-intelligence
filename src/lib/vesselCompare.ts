import { Vessel } from "@/types";

// ─────────────────────────────────────────────────────────────────────────
// 선박 비교 엔진 (VESSEL COMPARISON ENGINE)
// 비교표의 모든 값과 우열 판정은 순수 계산 로직으로 산출됩니다. LLM은 사용되지 않습니다.
// ─────────────────────────────────────────────────────────────────────────

export type Favorability = "higher" | "lower" | "neutral";

export interface CompareRow {
  key: string;
  label: string;
  unit: string;
  values: (number | undefined)[];
  bestIndex: number | null;
  favorable: Favorability;
}

interface CompareFieldSpec {
  key: keyof Vessel;
  label: string;
  unit: string;
  favorable: Favorability;
}

const COMPARE_FIELDS: CompareFieldSpec[] = [
  { key: "dwt", label: "재화중량톤", unit: "MT", favorable: "higher" },
  { key: "grossTonnage", label: "총톤수", unit: "GT", favorable: "neutral" },
  { key: "loa", label: "전장", unit: "m", favorable: "neutral" },
  { key: "beam", label: "형폭", unit: "m", favorable: "neutral" },
  { key: "draft", label: "흘수", unit: "m", favorable: "neutral" },
  { key: "builtYear", label: "건조연도", unit: "년", favorable: "higher" },
  { key: "speed", label: "속력", unit: "knots", favorable: "higher" },
  { key: "fuelConsumption", label: "연료소모량", unit: "MT/day", favorable: "lower" },
  { key: "cargoCapacity", label: "화물창 용량", unit: "CBM", favorable: "higher" },
];

export function buildCompareRows(vessels: Vessel[]): CompareRow[] {
  return COMPARE_FIELDS.map((spec) => {
    const values = vessels.map((v) => v[spec.key] as number | undefined);
    let bestIndex: number | null = null;

    if (spec.favorable !== "neutral") {
      const defined = values
        .map((v, i) => ({ v, i }))
        .filter((x): x is { v: number; i: number } => typeof x.v === "number");
      if (defined.length > 1) {
        const sorted = [...defined].sort((a, b) => (spec.favorable === "higher" ? b.v - a.v : a.v - b.v));
        if (sorted[0].v !== sorted[sorted.length - 1].v) bestIndex = sorted[0].i;
      }
    }

    return { key: spec.key as string, label: spec.label, unit: spec.unit, values, bestIndex, favorable: spec.favorable };
  });
}

const REFERENCE_YEAR = 2026;

export function generateComparisonInsight(vessels: Vessel[]): string[] {
  if (vessels.length < 2) return [];
  const insights: string[] = [];

  const withYear = vessels.filter((v) => v.builtYear);
  if (withYear.length > 1) {
    const oldest = [...withYear].sort((a, b) => a.builtYear! - b.builtYear!)[0];
    const newest = [...withYear].sort((a, b) => b.builtYear! - a.builtYear!)[0];
    if (oldest.id !== newest.id) {
      const ageGap = newest.builtYear! - oldest.builtYear!;
      insights.push(
        `${newest.vesselName}은(는) 선령 ${REFERENCE_YEAR - newest.builtYear!}년으로, ${oldest.vesselName}(선령 ${
          REFERENCE_YEAR - oldest.builtYear!
        }년)보다 ${ageGap}년 더 신조 선박입니다. 신조 선박은 연비와 규제 대응 측면에서 상대적 우위를 가질 가능성이 높습니다.`
      );
    }
  }

  const withEfficiency = vessels.filter((v) => v.dwt && v.fuelConsumption);
  if (withEfficiency.length > 1) {
    const ranked = withEfficiency
      .map((v) => ({ v, ratio: v.dwt! / v.fuelConsumption! }))
      .sort((a, b) => b.ratio - a.ratio);
    const best = ranked[0];
    const worst = ranked[ranked.length - 1];
    if (best.v.id !== worst.v.id) {
      const diffPct = Math.round((best.ratio / worst.ratio - 1) * 100);
      insights.push(
        `연료 효율(DWT ÷ 일일 연료소모량 기준)은 ${best.v.vesselName}이(가) 가장 우수하며, ${worst.v.vesselName} 대비 약 ${diffPct}% 높습니다.`
      );
    }
  }

  const withDwt = vessels.filter((v) => v.dwt);
  if (withDwt.length > 1) {
    const largest = [...withDwt].sort((a, b) => b.dwt! - a.dwt!)[0];
    insights.push(
      `선복량 기준으로는 ${largest.vesselName}(DWT ${largest.dwt!.toLocaleString()}MT)이 가장 큰 규모를 보유하고 있어, 대량 화물 장기 계약에 유리한 포지션입니다.`
    );
  }

  const altFuel = vessels.filter((v) => v.fuelType && v.fuelType !== "HFO");
  if (altFuel.length > 0 && altFuel.length < vessels.length) {
    const fuelTypes = [...new Set(altFuel.map((v) => v.fuelType))].join(" / ");
    insights.push(
      `${altFuel.map((v) => v.vesselName).join(", ")}은(는) 대체연료(${fuelTypes}) 대응 사양으로, 향후 환경규제 강화 국면에서 상대적 경쟁 우위를 확보할 수 있습니다.`
    );
  }

  return insights;
}
