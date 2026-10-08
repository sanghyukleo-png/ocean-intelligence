import { fetchSource, readJson, toNumber, isRecord } from "./http";
import { SourceError, type Observation, type SourceDef } from "./types";

// Brent·WTI 일간 종가: EIA Open Data API v2 petroleum/pri/spt (RBRTE = Europe Brent Spot FOB, RWTC = Cushing WTI Spot).
// 명세(eia.gov/opendata/documentation.php, 2026-10-08 확인): api_key는 URL 파라미터, data[]·facets[...][]·frequency·sort·length,
//   응답 response.data[] 행에 period와 요청한 데이터 열. v2.1.6부터 값은 문자열("68.12").
// 행의 열 이름(series·value·units)은 이 경로의 메타데이터 기준 — 키 발급 후 첫 응답으로 재확인한다.
// 열이 없으면 조용히 넘기지 않고 parse 실패로 기록한다.
// 발표: 일간 데이터가 주 1회(보통 수요일) 묶어서 공개 → 화면에 "일간 종가 · 주 1회 발표".
// 약관: EIA 데이터는 공공 도메인, 출처·발표일 표기 조건 재배포 허용(eia.gov/about/copyrights_reuse.php).

const API = "https://api.eia.gov/v2/petroleum/pri/spt/data/";
const SOURCE = "EIA";
const SOURCE_URL = "https://www.eia.gov/dnav/pet/pet_pri_spt_s1_d.htm";
const SERIES: Record<string, string> = { RBRTE: "brent", RWTC: "wti" };

export function parseEia(json: unknown, fetchedAt: string): Observation[] {
  const rows = isRecord(json) && isRecord(json.response) ? json.response.data : null;
  if (!Array.isArray(rows)) {
    const err = isRecord(json) && typeof json.error === "string" ? json.error : null;
    if (err && /api_key|API key/i.test(err)) throw new SourceError("auth", "API 키 거부");
    throw new SourceError("parse", "response.data 없음");
  }
  const out: Observation[] = [];
  for (const r of rows) {
    if (!isRecord(r)) continue;
    const metric = SERIES[String(r.series ?? "")];
    if (!metric) continue;
    if (!("value" in r)) throw new SourceError("parse", "value 열 없음");
    const value = toNumber(r.value);
    const period = String(r.period ?? "");
    if (value === null || !/^\d{4}-\d{2}-\d{2}$/.test(period)) continue;
    out.push({ metric, value, unit: "USD/bbl", asOf: period, asOfPrecision: "day", fetchedAt, source: SOURCE, sourceUrl: SOURCE_URL });
  }
  if (!out.length) throw new SourceError("empty", "RBRTE·RWTC 행 없음");
  return out.sort((a, b) => a.asOf.localeCompare(b.asOf));
}

export const eiaSource: SourceDef = {
  id: "eia",
  name: "EIA Open Data (Brent·WTI)",
  label: "EIA",
  sourceUrl: SOURCE_URL,
  provides: ["brent", "wti"],
  envKeys: ["EIA_API_KEY"],
  keyHelp: "eia.gov/opendata 에서 이메일로 즉시 발급",
  availability: "ready",
  cadence: "일간 종가 · 주 1회 발표",
  minIntervalSec: 6 * 3600,
  retryIntervalSec: 30 * 60,
  staleAfterSec: 10 * 86400, // 주 1회 발표 + 휴일
  terms: "공공 도메인 · 출처·발표일 표기",
  async collect({ env, now, fetch }) {
    const qs = new URLSearchParams({ api_key: env.EIA_API_KEY!, frequency: "daily", "data[0]": "value", "sort[0][column]": "period", "sort[0][direction]": "desc", length: "40" });
    qs.append("facets[series][]", "RBRTE");
    qs.append("facets[series][]", "RWTC");
    const res = await fetchSource(fetch, `${API}?${qs}`);
    return { observations: parseEia(await readJson(res), now.toISOString()) };
  },
};
