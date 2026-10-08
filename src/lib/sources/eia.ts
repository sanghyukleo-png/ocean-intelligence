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

// ── 키 없이: EIA 「Spot Prices for Crude Oil and Petroleum Products」 일간 표 ─────────────────
// EIA가 공개하는 HTML 표(최근 6거래일). API와 같은 공공 도메인 데이터라 출처·발표일 표기로 재게시 가능.
// 원유는 API 키가 없을 때 2순위, 석유제품(미국 걸프·뉴욕 현물)은 이 표가 유일한 소스.
// 구조(2026-10-08 실호출): <th class="Series5">MM/DD/YY</th> × 6, 품목 제목 <td class="DataStub2">,
//   지역 행 <td class="DataStub1">, 값 <td … class="DataB|Current2">, 하단 "Release Date: 10/7/2026".
const WEB_PAGE = "https://www.eia.gov/dnav/pet/pet_pri_spt_s1_d.htm";

/** "품목 제목|지역 행" → 지표 */
export const EIA_WEB_SERIES: Record<string, { metric: string; unit: string }> = {
  "Crude Oil|WTI - Cushing, Oklahoma": { metric: "wti", unit: "USD/bbl" },
  "Crude Oil|Brent - Europe": { metric: "brent", unit: "USD/bbl" },
  "Conventional Gasoline|U.S. Gulf Coast, Regular": { metric: "gasoline-usgc", unit: "USD/gal" },
  "Conventional Gasoline|New York Harbor, Regular": { metric: "gasoline-nyh", unit: "USD/gal" },
  "Ultra-Low-Sulfur No. 2 Diesel Fuel|U.S. Gulf Coast": { metric: "ulsd-usgc", unit: "USD/gal" },
  "Ultra-Low-Sulfur No. 2 Diesel Fuel|New York Harbor": { metric: "ulsd-nyh", unit: "USD/gal" },
  "Kerosene-Type Jet Fuel|U.S. Gulf Coast": { metric: "jet-usgc", unit: "USD/gal" },
  "Propane|Mont Belvieu, Texas": { metric: "propane-mb", unit: "USD/gal" },
};

export function parseEiaSpotPage(html: string, fetchedAt: string): Observation[] {
  const dates: string[] = [];
  for (const m of html.matchAll(/<th class="Series5">\s*(\d{2})\/(\d{2})\/(\d{2})\s*<\/th>/g)) {
    const d = `20${m[3]}-${m[1]}-${m[2]}`;
    if (!dates.includes(d)) dates.push(d);
    if (dates.length === 6) break;
  }
  if (dates.length < 2) throw new SourceError("parse", "날짜 머리(Series5) 없음");

  // 문서 순서대로 제목·지역·값 셀을 훑어 "제목|지역" 행을 만든다
  const rows = new Map<string, string[]>();
  let heading = "";
  let current: string[] | null = null;
  const re = /class="DataStub2">([^<]*)|class="DataStub1">([^<]*)<\/td>|<td[^>]*class="(?:DataB|Current2)"[^>]*>([^<]*)<\/td>/g;
  for (const m of html.matchAll(re)) {
    if (m[1] !== undefined) {
      heading = m[1].replace(/&nbsp;/g, " ").trim();
      current = null;
    } else if (m[2] !== undefined) {
      current = [];
      rows.set(`${heading}|${m[2].trim()}`, current);
    } else if (current && current.length < dates.length) current.push(m[3]);
  }

  const out: Observation[] = [];
  for (const [key, def] of Object.entries(EIA_WEB_SERIES)) {
    const cells = rows.get(key);
    if (!cells) {
      if (def.metric === "brent" || def.metric === "wti") throw new SourceError("parse", `${key} 행 없음`);
      continue;
    }
    cells.forEach((c, i) => {
      const value = toNumber(c);
      if (value === null) return; // 휴장일 등 빈칸
      out.push({ metric: def.metric, value, unit: def.unit, asOf: dates[i], asOfPrecision: "day", fetchedAt, source: SOURCE, sourceUrl: WEB_PAGE });
    });
  }
  if (!out.length) throw new SourceError("empty", "값 없음");
  return out.sort((a, b) => a.asOf.localeCompare(b.asOf));
}

export const eiaWebSource: SourceDef = {
  id: "eia-web",
  name: "EIA 원유·석유제품 현물가 공개 표",
  label: "EIA",
  sourceUrl: WEB_PAGE,
  provides: [...new Set(Object.values(EIA_WEB_SERIES).map((s) => s.metric))],
  envKeys: [],
  availability: "ready",
  cadence: "일간 종가 · 주 1회 발표",
  minIntervalSec: 6 * 3600,
  retryIntervalSec: 60 * 60,
  staleAfterSec: 10 * 86400,
  terms: "공공 도메인 · 출처·발표일 표기",
  async collect({ now, fetch }) {
    const res = await fetchSource(fetch, WEB_PAGE, { timeoutMs: 15000 });
    return { observations: parseEiaSpotPage(await res.text(), now.toISOString()) };
  },
};
