import { fetchSource, readJson, toNumber, isRecord } from "./http";
import { SourceError, type Observation, type SourceDef } from "./types";

// 컨테이너 운임지수 — 사용자 결정 2026-10-08(#3 "다른 사이트처럼 공개 페이지에서 가져오기").
//
// SCFI: 상하이해운거래소(SSEI) 공개 SCFI 페이지가 스스로 부르는 JSON(currentIndex)에서 "종합지수"만 읽는다.
//   항로별 값은 로그인(구독) 영역이라 쓰지 않는다. 사이트 고지는 "All Rights Reserved"뿐이며 자동 수집·재게시를
//   금지하는 약관 문구는 찾지 못함(2026-10-08). 국내 운임 정보 사이트들도 같은 방식으로 종합지수를 출처와 함께 게시한다.
//   주 1회 발표(금 15시 베이징) → 하루 1회 이하로만 조회, 출처·링크 표기. SSEI가 이의를 제기하면 즉시 중단한다.
//   명세(실호출): GET https://en.sse.net.cn/currentIndex?indexName=scfi
//     → {status:1, data:{currentDate, lastDate, lineDataList:[{dataItemTypeName:"SCFI_T", currentContent, lastContent, …}]}}
//
// KCCI: 한국해양진흥공사 공개 KCCI 표. 같은 자료가 공공데이터포털
//   「한국해양진흥공사_컨테이너선운임지수(KCCI)」(data.go.kr/data/15131881, 이용허락범위 제한 없음)로 개방돼 있다.
//   매주 월 14시 발표. 명세(실호출): GET https://www.kobc.or.kr/ebz/shippinginfo/kcci/gridList.do?mId=0304000000
//     → HTML 표: "Current Index YYYY-MM-DD · Previous Index YYYY-MM-DD" 머리, "KCCI Comprehensive Index 100% 현재 직전" 행.

const SSE_PAGE = "https://en.sse.net.cn/indices/scfinew.jsp";
const SSE_API = "https://en.sse.net.cn/currentIndex?indexName=scfi";
const KOBC_PAGE = "https://www.kobc.or.kr/ebz/shippinginfo/kcci/gridList.do?mId=0304000000";

export function parseSseScfi(json: unknown, fetchedAt: string): Observation[] {
  if (!isRecord(json) || !isRecord(json.data)) throw new SourceError("parse", "data 없음");
  if (json.status !== 1) throw new SourceError("http", `status ${String(json.status)}`);
  const d = json.data;
  const list = Array.isArray(d.lineDataList) ? d.lineDataList : [];
  const comp = list.find((l) => isRecord(l) && l.dataItemTypeName === "SCFI_T") as Record<string, unknown> | undefined;
  if (!comp) throw new SourceError("parse", "종합지수(SCFI_T) 행 없음");
  const out: Observation[] = [];
  const base = { metric: "scfi", unit: "pt", asOfPrecision: "day" as const, fetchedAt, source: "SSEI", sourceUrl: SSE_PAGE };
  const last = toNumber(comp.lastContent);
  const cur = toNumber(comp.currentContent);
  const date = (v: unknown) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);
  if (last !== null && date(d.lastDate)) out.push({ ...base, value: Math.round(last * 100) / 100, asOf: date(d.lastDate)! });
  if (cur !== null && date(d.currentDate)) out.push({ ...base, value: Math.round(cur * 100) / 100, asOf: date(d.currentDate)! });
  if (!out.length) throw new SourceError("empty", "종합지수 값 없음");
  return out;
}

export function parseKobcKcci(html: string, fetchedAt: string): Observation[] {
  const text = html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ");
  const dates = text.match(/Current Index\s+(\d{4}-\d{2}-\d{2})\s+Previous Index\s+(\d{4}-\d{2}-\d{2})/);
  if (!dates) throw new SourceError("parse", "기준일 머리 없음");
  const row = text.match(/KCCI\s+Comprehensive Index\s+100%\s+([\d,.]+)\s+([\d,.]+)/);
  if (!row) throw new SourceError("parse", "KCCI 종합지수 행 없음");
  const cur = toNumber(row[1]);
  const prev = toNumber(row[2]);
  if (cur === null || prev === null) throw new SourceError("parse", "지수 숫자 형식 오류");
  const base = { metric: "kcci", unit: "pt", asOfPrecision: "day" as const, fetchedAt, source: "KOBC", sourceUrl: KOBC_PAGE };
  return [
    { ...base, value: prev, asOf: dates[2] },
    { ...base, value: cur, asOf: dates[1] },
  ];
}

export const sseScfiSource: SourceDef = {
  id: "sse-scfi",
  name: "상하이해운거래소 SCFI 종합지수",
  label: "상하이해운거래소",
  sourceUrl: SSE_PAGE,
  provides: ["scfi"],
  envKeys: [],
  availability: "ready",
  cadence: "주 1회 · 금 16시(KST)",
  minIntervalSec: 24 * 3600,
  retryIntervalSec: 6 * 3600,
  staleAfterSec: 10 * 86400, // 중국 연휴에는 발표를 건너뛴다
  terms: "공개 종합지수만 · 출처 표기 · 하루 1회 이하 · 이의 제기 시 중단",
  async collect({ now, fetch }) {
    const res = await fetchSource(fetch, SSE_API, { headers: { Accept: "application/json", Referer: SSE_PAGE }, timeoutMs: 15000 });
    return { observations: parseSseScfi(await readJson(res), now.toISOString()) };
  },
};

export const kobcKcciSource: SourceDef = {
  id: "kobc-kcci",
  name: "한국해양진흥공사 KCCI 종합지수",
  label: "한국해양진흥공사",
  sourceUrl: KOBC_PAGE,
  provides: ["kcci"],
  envKeys: [],
  availability: "ready",
  cadence: "주 1회 · 월 14시",
  minIntervalSec: 12 * 3600,
  retryIntervalSec: 3 * 3600,
  staleAfterSec: 10 * 86400,
  terms: "공공데이터포털 개방 데이터(이용허락범위 제한 없음) · 출처 표기",
  async collect({ now, fetch }) {
    const res = await fetchSource(fetch, KOBC_PAGE, { timeoutMs: 15000 });
    return { observations: parseKobcKcci(await res.text(), now.toISOString()) };
  },
};
