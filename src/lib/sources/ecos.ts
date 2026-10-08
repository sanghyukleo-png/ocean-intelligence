import { fetchSource, readJson, toNumber, kstYmd, ymdToIso, isRecord } from "./http";
import { SourceError, type Observation, type SourceDef } from "./types";

// USD/KRW 2순위: 한국은행 ECOS 통계 731Y001(주요국 통화의 대원화환율) 항목 0000001(원/미국달러 매매기준율), 일간.
// 명세(2026-10-08 ECOS 공개 sample 키로 실호출 확인 — 운영에는 sample 키를 쓰지 않는다):
//   GET https://ecos.bok.or.kr/api/StatisticSearch/{KEY}/json/kr/1/{N}/731Y001/D/{YYYYMMDD}/{YYYYMMDD}/0000001
//   성공 {StatisticSearch:{list_total_count, row:[{TIME:"20261001", DATA_VALUE:"1355.7", UNIT_NAME:"원", ...}]}}
//   오류 {RESULT:{CODE:"INFO-100", MESSAGE}} (INFO-200 = 해당 데이터 없음)

const SOURCE = "한국은행 ECOS";
const SOURCE_URL = "https://ecos.bok.or.kr/";

export function parseEcos(json: unknown, fetchedAt: string): Observation[] {
  if (!isRecord(json)) throw new SourceError("parse", "객체 응답이 아님");
  if (isRecord(json.RESULT)) {
    const code = String(json.RESULT.CODE ?? "");
    if (code === "INFO-200") throw new SourceError("empty", "해당 기간 데이터 없음(INFO-200)");
    if (code === "INFO-100") throw new SourceError("auth", "인증키 오류(INFO-100)");
    throw new SourceError("http", `ECOS ${code}`);
  }
  const rows = isRecord(json.StatisticSearch) ? json.StatisticSearch.row : null;
  if (!Array.isArray(rows)) throw new SourceError("parse", "StatisticSearch.row 없음");
  const out: Observation[] = [];
  for (const r of rows) {
    if (!isRecord(r) || r.STAT_CODE !== "731Y001" || r.ITEM_CODE1 !== "0000001") continue;
    const value = toNumber(r.DATA_VALUE);
    const time = String(r.TIME ?? "");
    if (value === null || !/^\d{8}$/.test(time)) continue;
    out.push({ metric: "usdkrw", value, unit: "KRW/USD", asOf: ymdToIso(time), asOfPrecision: "day", fetchedAt, source: SOURCE, sourceUrl: SOURCE_URL });
  }
  if (!out.length) throw new SourceError("empty", "원/미국달러 행 없음");
  return out.sort((a, b) => a.asOf.localeCompare(b.asOf));
}

export const ecosSource: SourceDef = {
  id: "ecos",
  name: "한국은행 ECOS",
  label: "한국은행 ECOS",
  sourceUrl: SOURCE_URL,
  provides: ["usdkrw"],
  envKeys: ["ECOS_API_KEY"],
  keyHelp: "ECOS Open API(ecos.bok.or.kr/api) 인증키 신청",
  availability: "ready",
  cadence: "영업일 1회",
  minIntervalSec: 3 * 3600,
  retryIntervalSec: 30 * 60,
  staleAfterSec: 4 * 86400,
  terms: "공공 · 출처 표기 · 키당 일 호출 한도 있음(약관 확인)",
  async collect({ env, now, fetch }) {
    const key = encodeURIComponent(env.ECOS_API_KEY!);
    const url = `https://ecos.bok.or.kr/api/StatisticSearch/${key}/json/kr/1/30/731Y001/D/${kstYmd(now, -14)}/${kstYmd(now)}/0000001`;
    const res = await fetchSource(fetch, url);
    return { observations: parseEcos(await readJson(res), now.toISOString()) };
  },
};
