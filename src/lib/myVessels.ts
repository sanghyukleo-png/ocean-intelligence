import type { Vessel } from "@/types";

// 내 선박 — 사용자가 Q88·제원 텍스트에서 추출한 선박만 이 브라우저(localStorage)에 저장한다.
// 가상 선박 데이터베이스는 두지 않는다(2026-10-08 결정). 비교 화면은 이 목록만 쓴다.

const KEY = "oi-my-vessels";
const EVENT = "oi:my-vessels";
const MAX = 20;
const EMPTY: Vessel[] = [];

const NUM_KEYS = ["dwt", "draft", "loa", "beam", "grossTonnage", "netTonnage", "builtYear", "speed", "fuelConsumption", "cargoCapacity", "extractionConfidence"] as const;
const STR_KEYS = ["imo", "fuelType", "owner", "operator", "class", "flag"] as const;

/** 저장값 검증 — 형식이 맞지 않는 항목은 버린다 */
export function parseMyVessels(raw: unknown): Vessel[] {
  if (!Array.isArray(raw)) return EMPTY;
  const out: Vessel[] = [];
  for (const r of raw) {
    if (typeof r !== "object" || r === null) continue;
    const o = r as Record<string, unknown>;
    if (typeof o.id !== "string" || typeof o.vesselName !== "string" || !o.vesselName.trim()) continue;
    const v: Vessel = { id: o.id, vesselName: o.vesselName, vesselType: typeof o.vesselType === "string" ? o.vesselType : "선종 미확인" };
    for (const k of NUM_KEYS) if (typeof o[k] === "number" && Number.isFinite(o[k])) (v as unknown as Record<string, number>)[k] = o[k] as number;
    for (const k of STR_KEYS) if (typeof o[k] === "string" && o[k]) (v as unknown as Record<string, string>)[k] = o[k] as string;
    out.push(v);
  }
  return out.slice(0, MAX);
}

/** 추출 결과 → 저장할 선박. 선명이 없으면 저장하지 않는다 */
export function vesselFromExtraction(partial: Partial<Vessel>, confidence: number, now = new Date()): Vessel | null {
  const name = partial.vesselName?.trim();
  if (!name) return null;
  const id = partial.imo ? `imo-${partial.imo}` : `name-${name.toLowerCase().replace(/\s+/g, "-")}`;
  return parseMyVessels([{ ...partial, id, vesselName: name, vesselType: partial.vesselType ?? "선종 미확인", extractionConfidence: confidence, savedAt: now.toISOString() }])[0] ?? null;
}

let cache: { raw: string | null; list: Vessel[] } = { raw: null, list: EMPTY };

export function readMyVessels(): Vessel[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {}
  if (raw !== cache.raw) {
    let list = EMPTY;
    try {
      list = raw ? parseMyVessels(JSON.parse(raw)) : EMPTY;
    } catch {}
    cache = { raw, list };
  }
  return cache.list;
}

export function subscribeMyVessels(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(EVENT, cb);
  };
}

export const emptyVessels = () => EMPTY;

function write(list: Vessel[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

/** 같은 IMO(없으면 선명)는 새 값으로 바꾼다 */
export function saveMyVessel(v: Vessel) {
  write([v, ...readMyVessels().filter((x) => x.id !== v.id)]);
}

export function removeMyVessel(id: string) {
  write(readMyVessels().filter((x) => x.id !== id));
}
