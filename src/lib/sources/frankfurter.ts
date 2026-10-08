import { fetchSource, readJson, toNumber } from "./http";
import { SourceError, type Observation, type SourceDef } from "./types";

// USD/KRW 3순위(키 불필요): Frankfurter가 중계하는 ECB 기준환율(EUR 기준 고시를 USD 기준으로 교차 산출).
// 국내 고시(수출입은행·한국은행 매매기준율)와 몇 원 차이가 날 수 있어 1·2순위 키가 없을 때만 쓰고 출처를 그대로 표기한다.
// 약관: Frankfurter 무료·무키·쿼터 없음(남용 방지 속도 제한), 환율 자체는 제공 기관(ECB) 조건을 따름 — ECB는 출처 표기 조건으로 재사용 허용.
// 명세 확인(2026-10-08 실호출): GET /v2/rates?base=USD&quotes=KRW&providers=ecb&from=&to= → [{date, base, quote, rate}]

const API = "https://api.frankfurter.dev/v2/rates";
const SOURCE = "ECB 기준환율 (Frankfurter)";
const SOURCE_URL = "https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html";

// 수출 시장 통화(S-OIL 주요 수출지: 중국·일본·싱가포르·호주, 유럽). USD 기준 고시를 관행 표기로 바꾼다:
// USD/KRW·USD/JPY·USD/CNY·USD/SGD는 그대로, EUR·AUD는 역수로 EUR/USD·AUD/USD.
const QUOTES: Record<string, { metric: string; unit: string; invert?: boolean }> = {
  KRW: { metric: "usdkrw", unit: "KRW/USD" },
  JPY: { metric: "usdjpy", unit: "JPY/USD" },
  CNY: { metric: "usdcny", unit: "CNY/USD" },
  SGD: { metric: "usdsgd", unit: "SGD/USD" },
  EUR: { metric: "eurusd", unit: "USD/EUR", invert: true },
  AUD: { metric: "audusd", unit: "USD/AUD", invert: true },
};

export function parseFrankfurter(json: unknown, fetchedAt: string): Observation[] {
  if (!Array.isArray(json)) throw new SourceError("parse", "배열 응답이 아님");
  const out: Observation[] = [];
  for (const row of json) {
    if (typeof row !== "object" || row === null) continue;
    const r = row as Record<string, unknown>;
    const q = QUOTES[String(r.quote)];
    if (r.base !== "USD" || !q) continue;
    const rate = toNumber(r.rate);
    const date = typeof r.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(r.date) ? r.date : null;
    if (rate === null || rate <= 0 || !date) continue;
    const value = q.invert ? Math.round((1 / rate) * 1e5) / 1e5 : rate;
    out.push({ metric: q.metric, value, unit: q.unit, asOf: date, asOfPrecision: "day", fetchedAt, source: SOURCE, sourceUrl: SOURCE_URL });
  }
  if (!out.some((o) => o.metric === "usdkrw")) throw new SourceError("empty", "USD/KRW 행 없음");
  return out.sort((a, b) => a.asOf.localeCompare(b.asOf));
}

export const frankfurterSource: SourceDef = {
  id: "frankfurter-ecb",
  name: "ECB 기준환율 (Frankfurter)",
  label: "ECB 기준환율",
  sourceUrl: SOURCE_URL,
  provides: Object.values(QUOTES).map((q) => q.metric),
  envKeys: [],
  availability: "ready",
  cadence: "영업일 1회 고시(CET 16시경)",
  minIntervalSec: 3 * 3600,
  retryIntervalSec: 15 * 60,
  staleAfterSec: 4 * 86400, // 주말·휴일 포함
  terms: "무료·키 불필요. ECB 기준환율 — 출처 표기 조건 재사용",
  async collect({ now, fetch }) {
    const to = now.toISOString().slice(0, 10);
    const from = new Date(now.getTime() - 14 * 86400_000).toISOString().slice(0, 10);
    const res = await fetchSource(fetch, `${API}?base=USD&quotes=${Object.keys(QUOTES).join(",")}&providers=ecb&from=${from}&to=${to}`);
    return { observations: parseFrankfurter(await readJson(res), now.toISOString()) };
  },
};
