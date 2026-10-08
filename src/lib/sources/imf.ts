import { fetchSource, readJson, toNumber, isRecord } from "./http";
import { SourceError, type Observation, type SourceDef } from "./types";

// Dubai 원유 월평균 — IMF Primary Commodity Prices(PCPS) POILDUB (USD/bbl, 월간). 사용자 결정 2026-10-08(#1 b).
// 일간 Dubai는 Platts 평가라 수집 금지(지시서 9장) → 공개 월평균만 "월평균"으로 명시해 표시한다. 일간처럼 보이게 하지 않는다.
// 명세(2026-10-08 실호출, 키 불필요): IMF SDMX 3.0
//   GET https://api.imf.org/external/sdmx/3.0/data/dataflow/IMF.RES/PCPS/+/G001.POILDUB.USD.M?c[TIME_PERIOD]=ge:YYYY-MM
//   → data.structures[0].dimensions.observation[0].values[i].value = "2026-M09", data.dataSets[0].series[…].observations[i][0] = "111.82…"
// 약관(imf.org/en/About/copyright-and-terms): IMF 출처 표기 조건 재사용, 상업적 재사용은 IMF 허락 필요, 대량 자동 내려받기 금지
//   → 시리즈 1개를 하루 1번 이하로만 조회.

const SOURCE_URL = "https://data.imf.org/en/datasets/IMF.RES:PCPS";
const API = "https://api.imf.org/external/sdmx/3.0/data/dataflow/IMF.RES/PCPS/+/G001.POILDUB.USD.M";

export function parseImfPcps(json: unknown, fetchedAt: string): Observation[] {
  const data = isRecord(json) && isRecord(json.data) ? json.data : null;
  const structure = data && Array.isArray(data.structures) ? data.structures[0] : null;
  const dataSet = data && Array.isArray(data.dataSets) ? data.dataSets[0] : null;
  if (!isRecord(structure) || !isRecord(dataSet)) throw new SourceError("parse", "data.structures·dataSets 없음");
  const dims = isRecord(structure.dimensions) && Array.isArray(structure.dimensions.observation) ? structure.dimensions.observation : null;
  const periods = dims && isRecord(dims[0]) && Array.isArray(dims[0].values) ? (dims[0].values as Record<string, unknown>[]) : null;
  if (!periods) throw new SourceError("parse", "TIME_PERIOD 차원 없음");
  const series = isRecord(dataSet.series) ? Object.values(dataSet.series) : [];
  if (!series.length) throw new SourceError("empty", "POILDUB 시리즈 없음");
  const obs = isRecord(series[0]) && isRecord(series[0].observations) ? series[0].observations : {};
  const out: Observation[] = [];
  for (const [idx, row] of Object.entries(obs)) {
    const period = String(periods[Number(idx)]?.value ?? periods[Number(idx)]?.id ?? "");
    const m = period.match(/^(\d{4})-M(\d{2})$/);
    const value = Array.isArray(row) ? toNumber(row[0]) : null;
    if (!m || value === null) continue;
    out.push({ metric: "dubai", value: Math.round(value * 100) / 100, unit: "USD/bbl", asOf: `${m[1]}-${m[2]}`, asOfPrecision: "month", fetchedAt, source: "IMF", sourceUrl: SOURCE_URL });
  }
  if (!out.length) throw new SourceError("empty", "월 값 없음");
  return out.sort((a, b) => a.asOf.localeCompare(b.asOf));
}

export const imfDubaiSource: SourceDef = {
  id: "imf-pcps",
  name: "IMF Primary Commodity Prices (Dubai 월평균)",
  label: "IMF PCPS",
  sourceUrl: SOURCE_URL,
  provides: ["dubai"],
  envKeys: [],
  availability: "ready",
  cadence: "월평균 · 월 1회 발표",
  // 월 값은 보통 다음 달 초에 나온다 — 하루 1회 확인이면 충분
  minIntervalSec: 24 * 3600,
  retryIntervalSec: 3 * 3600,
  staleAfterSec: 45 * 86400,
  terms: "IMF 출처 표기 · 상업적 재사용은 IMF 허락 필요 · 대량 자동 내려받기 금지",
  async collect({ now, fetch }) {
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 13, 1)).toISOString().slice(0, 7);
    const res = await fetchSource(fetch, `${API}?c%5BTIME_PERIOD%5D=ge:${from}`, { headers: { Accept: "application/json" }, timeoutMs: 15000 });
    return { observations: parseImfPcps(await readJson(res), now.toISOString()) };
  },
};
