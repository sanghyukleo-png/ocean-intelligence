import { SourceError } from "./types";

/** 원천 호출: 시간 초과·네트워크·HTTP 오류를 구분해 SourceError로 던진다. 캐시하지 않는다. */
export async function fetchSource(
  fetchImpl: typeof fetch,
  url: string,
  init: RequestInit & { timeoutMs?: number } = {}
): Promise<Response> {
  const { timeoutMs = 8000, ...rest } = init;
  let res: Response;
  try {
    res = await fetchImpl(url, { cache: "no-store", ...rest, signal: AbortSignal.timeout(timeoutMs) });
  } catch (e) {
    if (e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError")) {
      throw new SourceError("timeout", `${timeoutMs / 1000}초 안에 응답 없음`);
    }
    throw new SourceError("network", "원천 서버에 연결하지 못함");
  }
  if (res.status === 401 || res.status === 403) throw new SourceError("auth", `HTTP ${res.status}`, res.status);
  if (!res.ok) throw new SourceError("http", `HTTP ${res.status}`, res.status);
  return res;
}

export async function readJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text.trim()) throw new SourceError("empty", "빈 응답 본문");
  try {
    return JSON.parse(text);
  } catch {
    throw new SourceError("parse", "JSON이 아닌 응답");
  }
}

/** "1,343.5" · "68.12" · 68.12 → number. 실패하면 null */
export function toNumber(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v !== "string") return null;
  const s = v.replace(/,/g, "").trim();
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  return Number(s);
}

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** KST 기준 YYYYMMDD (공공 API 날짜 파라미터) */
export function kstYmd(d: Date, offsetDays = 0): string {
  const t = new Date(d.getTime() + 9 * 3600_000 + offsetDays * 86400_000);
  return t.toISOString().slice(0, 10).replace(/-/g, "");
}

/** "20261007" → "2026-10-07" */
export function ymdToIso(ymd: string): string {
  return `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`;
}

/** 기상청 "202610070730"(KST) → ISO(UTC) */
export function kmaTimeToIso(s: string | number | undefined | null): string | null {
  const v = String(s ?? "").trim();
  if (!/^\d{12}$/.test(v)) return null;
  const iso = `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}T${v.slice(8, 10)}:${v.slice(10, 12)}:00+09:00`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
