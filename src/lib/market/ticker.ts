import type { DataGrade, DataProvenance } from "@/components/ui/badge";
import type { NumFormat } from "@/lib/utils";

// 홈 라이브 티커(지시서 11.5 순서). 값은 Phase 2.5의 수집 파이프라인(/api/data)에서 채운다.
// 소스가 연결되기 전에는 값을 비우고 "연결 예정"으로 표시한다 — 가짜 값으로 채우지 않는다.

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

const PENDING: Pick<TickerItem, "value" | "changePct" | "grade"> = { value: null, changePct: null, grade: "pending" };

export const TICKER_SPEC: Omit<TickerItem, "value" | "changePct" | "grade">[] = [
  { key: "brent", label: "Brent", unit: "$/bbl", format: { decimals: 2 }, provenance: { source: "EIA", cadence: "일간 종가 · 주 1회 발표" }, positiveIsGood: null },
  { key: "dubai", label: "Dubai", unit: "$/bbl", format: { decimals: 2 }, provenance: { cadence: "소스 검토 중" }, positiveIsGood: null },
  { key: "usdkrw", label: "USD/KRW", unit: "원", format: { decimals: 2 }, provenance: { source: "한국수출입은행", cadence: "영업일 1회 고시" }, positiveIsGood: null },
  { key: "vlsfo-sg", label: "VLSFO 싱가포르", unit: "$/MT", format: { decimals: 0 }, provenance: { cadence: "소스 검토 중" }, positiveIsGood: null },
  { key: "vlsfo-busan", label: "VLSFO 부산", unit: "$/MT", format: { decimals: 0 }, provenance: { cadence: "소스 검토 중" }, positiveIsGood: null },
  { key: "scfi", label: "SCFI", unit: "pt", format: { decimals: 0 }, provenance: { source: "상하이해운거래소", cadence: "주 1회 · 금" }, positiveIsGood: null },
  { key: "kr-warnings", label: "국내항 경보", unit: "곳", format: { decimals: 0 }, provenance: { source: "기상청", cadence: "수시 발표" }, positiveIsGood: false },
];

export async function getTickerItems(): Promise<TickerItem[]> {
  return TICKER_SPEC.map((spec) => ({ ...spec, ...PENDING }));
}
