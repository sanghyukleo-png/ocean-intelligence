// 벙커가 직접 입력(사용자 결정 2026-10-08 #2 c): 약관이 수집·재게시를 허용하는 무료 소스가 없어 수집하지 않는다.
// 사용자가 입력한 값을 이 브라우저(localStorage)에만 저장하고, 항차·항로 계산기(Phase 5)가 기본값으로 불러온다.

export const BUNKER_FIELDS = [
  { key: "vlsfo-sg", port: "싱가포르", fuel: "VLSFO" },
  { key: "mgo-sg", port: "싱가포르", fuel: "MGO" },
  { key: "vlsfo-busan", port: "부산", fuel: "VLSFO" },
  { key: "mgo-busan", port: "부산", fuel: "MGO" },
] as const;

export type BunkerKey = (typeof BUNKER_FIELDS)[number]["key"];

export interface BunkerInput {
  /** $/MT */
  prices: Partial<Record<BunkerKey, number>>;
  /** 사용자가 적은 시세 기준일(YYYY-MM-DD) */
  asOf: string | null;
  /** 출처 메모(예: 공급사 견적) */
  note: string;
  savedAt: string | null;
}

const KEY = "oi-bunker-input";
export const EMPTY_BUNKER: BunkerInput = { prices: {}, asOf: null, note: "", savedAt: null };

/** 저장값 검증 — 형식이 맞지 않는 항목은 버린다 */
export function parseBunkerInput(raw: unknown): BunkerInput {
  if (typeof raw !== "object" || raw === null) return EMPTY_BUNKER;
  const r = raw as Record<string, unknown>;
  const prices: BunkerInput["prices"] = {};
  const src = typeof r.prices === "object" && r.prices !== null ? (r.prices as Record<string, unknown>) : {};
  for (const f of BUNKER_FIELDS) {
    const v = src[f.key];
    if (typeof v === "number" && Number.isFinite(v) && v > 0) prices[f.key] = v;
  }
  const asOf = typeof r.asOf === "string" && /^\d{4}-\d{2}-\d{2}$/.test(r.asOf) ? r.asOf : null;
  return {
    prices,
    asOf,
    note: typeof r.note === "string" ? r.note.slice(0, 120) : "",
    savedAt: typeof r.savedAt === "string" ? r.savedAt : null,
  };
}

// localStorage 스냅샷 구독(useSyncExternalStore) — 같은 탭(커스텀 이벤트)과 다른 탭(storage) 변경을 모두 반영
const EVENT = "oi:bunker-input";
let cache: { raw: string | null; value: BunkerInput } = { raw: null, value: EMPTY_BUNKER };

export function readBunkerInput(): BunkerInput {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {}
  if (raw !== cache.raw) {
    let value = EMPTY_BUNKER;
    try {
      value = raw ? parseBunkerInput(JSON.parse(raw)) : EMPTY_BUNKER;
    } catch {}
    cache = { raw, value };
  }
  return cache.value;
}

export function subscribeBunkerInput(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(EVENT, cb);
  };
}

export function writeBunkerInput(v: BunkerInput) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(v));
  } catch {
    // 사생활 보호 모드 등 저장 불가
  }
  window.dispatchEvent(new Event(EVENT));
}
