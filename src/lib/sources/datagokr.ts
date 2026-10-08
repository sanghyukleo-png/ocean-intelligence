import { fetchSource, isRecord } from "./http";
import { SourceError } from "./types";

// 공공데이터포털(apis.data.go.kr) 공통 응답 처리.
// 정상: {response:{header:{resultCode,resultMsg}, body:{items:{item:[…] | {…}}, totalCount, …}}}
// 게이트웨이 오류(키 미등록·한도 초과)는 dataType=JSON을 요청해도 XML(<OpenAPI_ServiceResponse>)로 온다.
// 에러 코드는 각 활용가이드 "Open API 에러 코드 정리": 03 NODATA, 20 접근거부, 22 한도 초과, 30 미등록 키, 31 기한 만료, 32 미등록 IP.

const AUTH_CODES = new Set(["20", "21", "22", "30", "31", "32", "33"]);

export interface DataGoKrResult {
  items: Record<string, unknown>[];
  totalCount: number;
  /** NODATA_ERROR(03) — 조회 조건에 해당하는 자료 없음 */
  noData: boolean;
}

export function parseDataGoKr(text: string): DataGoKrResult {
  const trimmed = text.trim();
  if (!trimmed) throw new SourceError("empty", "빈 응답 본문");
  if (trimmed.startsWith("<")) {
    const code = trimmed.match(/<returnReasonCode>(\d+)<\/returnReasonCode>/)?.[1] ?? trimmed.match(/<resultCode>(\d+)<\/resultCode>/)?.[1];
    const msg = trimmed.match(/<returnAuthMsg>([^<]+)<\/returnAuthMsg>/)?.[1] ?? trimmed.match(/<resultMsg>([^<]+)<\/resultMsg>/)?.[1] ?? "XML 오류 응답";
    if (code && AUTH_CODES.has(code.padStart(2, "0"))) throw new SourceError("auth", `${msg} (${code})`);
    if (code === "03" || code === "3") return { items: [], totalCount: 0, noData: true };
    throw new SourceError("http", `${msg}${code ? ` (${code})` : ""}`);
  }
  let json: unknown;
  try {
    json = JSON.parse(trimmed);
  } catch {
    throw new SourceError("parse", "JSON이 아닌 응답");
  }
  const response = isRecord(json) && isRecord(json.response) ? json.response : null;
  const header = response && isRecord(response.header) ? response.header : null;
  if (!header) throw new SourceError("parse", "response.header 없음");
  const code = String(header.resultCode ?? "").padStart(2, "0");
  if (code === "03") return { items: [], totalCount: 0, noData: true };
  if (AUTH_CODES.has(code)) throw new SourceError("auth", `${String(header.resultMsg ?? "")} (${code})`);
  if (code !== "00") throw new SourceError("http", `${String(header.resultMsg ?? "오류")} (${code})`);
  const body = isRecord(response!.body) ? response!.body : null;
  const rawItems = body && isRecord(body.items) ? body.items.item : null;
  const items = Array.isArray(rawItems) ? rawItems : isRecord(rawItems) ? [rawItems] : [];
  return { items: items.filter(isRecord), totalCount: Number(body?.totalCount ?? items.length), noData: false };
}

export async function callDataGoKr(fetchImpl: typeof fetch, base: string, op: string, params: Record<string, string>, serviceKey: string) {
  const qs = new URLSearchParams({ ...params, dataType: "JSON" });
  // 공공데이터포털 키는 Decoding 키를 URL 인코딩해 보낸다
  const url = `${base}/${op}?serviceKey=${encodeURIComponent(serviceKey)}&${qs}`;
  const res = await fetchSource(fetchImpl, url, { timeoutMs: 10000 });
  return parseDataGoKr(await res.text());
}
