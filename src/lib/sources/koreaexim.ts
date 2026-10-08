import { fetchSource, readJson, toNumber, kstYmd, ymdToIso } from "./http";
import { SourceError, type Observation, type SourceDef } from "./types";

// USD/KRW 1순위: 한국수출입은행 현재환율 API(AP01) 매매기준율.
// 명세(수출입은행 Open API 안내 HPHKIR020M01 apino=2, 2026-10-08 확인):
//   GET https://oapi.koreaexim.go.kr/site/program/financial/exchangeJSON?authkey=&searchdate=YYYYMMDD&data=AP01
//   응답 배열 [{result, cur_unit, cur_nm, ttb, tts, deal_bas_r, bkpr, ...}] — 숫자는 "1,066.9" 같은 문자열
//   result 1 성공 · 2 DATA코드 오류 · 3 인증코드 오류 · 4 일일제한횟수(1,000회) 마감
//   비영업일 또는 당일 11시 이전 요청은 null(빈 배열) 반환 → 최근 영업일까지 거슬러 조회
// 약관: 공공데이터포털 등록 "이용허락범위 제한 없음".

const API = "https://oapi.koreaexim.go.kr/site/program/financial/exchangeJSON";
const SOURCE = "한국수출입은행";
const SOURCE_URL = "https://www.koreaexim.go.kr/wg/HPHKWG057M01";

/** 하루치 응답에서 USD 매매기준율. 데이터 없는 날이면 null */
export function parseKoreaExim(json: unknown): number | null {
  if (!Array.isArray(json)) throw new SourceError("parse", "배열 응답이 아님");
  if (!json.length) return null;
  const first = json[0] as Record<string, unknown>;
  const result = Number(first?.result);
  if (result === 3) throw new SourceError("auth", "인증키 오류(result 3)");
  if (result === 4) throw new SourceError("auth", "일일 호출 한도 1,000회 초과(result 4)");
  if (result === 2) throw new SourceError("parse", "DATA 코드 오류(result 2)");
  const usd = json.find((r) => (r as Record<string, unknown>)?.cur_unit === "USD") as Record<string, unknown> | undefined;
  if (!usd) return null;
  return toNumber(usd.deal_bas_r);
}

export const koreaEximSource: SourceDef = {
  id: "koreaexim",
  name: "한국수출입은행 환율 API",
  label: "한국수출입은행",
  sourceUrl: SOURCE_URL,
  provides: ["usdkrw"],
  envKeys: ["KOREAEXIM_API_KEY"],
  keyHelp: "한국수출입은행 Open API(koreaexim.go.kr) 인증키 신청",
  availability: "ready",
  cadence: "영업일 1회 고시(11시 이후 제공)",
  minIntervalSec: 3 * 3600,
  retryIntervalSec: 30 * 60,
  staleAfterSec: 4 * 86400,
  terms: "공공데이터 · 이용허락범위 제한 없음 · 일 1,000회",
  async collect({ env, now, fetch }) {
    const key = env.KOREAEXIM_API_KEY!;
    const fetchedAt = now.toISOString();
    const found: Observation[] = [];
    // 오늘부터 최대 7일 거슬러 영업일 2개(현재값·직전값)를 찾는다
    for (let back = 0; back < 7 && found.length < 2; back++) {
      const ymd = kstYmd(now, -back);
      const res = await fetchSource(fetch, `${API}?authkey=${encodeURIComponent(key)}&searchdate=${ymd}&data=AP01`);
      const value = parseKoreaExim(await readJson(res));
      if (value === null) continue;
      found.push({ metric: "usdkrw", value, unit: "KRW/USD", asOf: ymdToIso(ymd), asOfPrecision: "day", fetchedAt, source: SOURCE, sourceUrl: SOURCE_URL });
    }
    if (!found.length) throw new SourceError("empty", "최근 7일 고시값 없음");
    return { observations: found.reverse() };
  },
};
