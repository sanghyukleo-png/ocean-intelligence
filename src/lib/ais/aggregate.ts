import type { AisGate } from "@/data/geo/aisAreas";

// AIS 스냅샷 집계(순수 함수). 개별 선박 추적이 아니라 오퍼레이터용 척수 집계(지시서 11.3).
// 선종: ITU-R M.1371 선종 코드 80–89 = Tanker. 정적 정보(ShipStaticData)는 약 6분 간격이라
// 짧은 수집 창에서는 선종을 모를 수 있다 → 이전 수집에서 쌓은 MMSI별 정적 정보 캐시를 함께 쓴다.

export interface AisPosition {
  mmsi: number;
  lat: number;
  lon: number;
  /** 대지속력(kn) */
  sog: number;
  /** 대지침로(°). 360 = 사용 불가 */
  cog: number;
  at: string;
}

export interface AisStatic {
  type: number;
  /** 선수~선미 길이(m) = Dimension A + B. 0이면 미상 */
  lengthM: number;
  name: string;
  imo: number;
  at: string;
}

export const isTanker = (type: number) => type >= 80 && type <= 89;

/** 길이 구간 — 선형 이름을 붙이지 않는다(AIS 치수는 자가 입력이라 "추정") */
export const LENGTH_BUCKETS = [
  { id: "lt130", label: "130m 미만", max: 130 },
  { id: "130-200", label: "130–200m", max: 200 },
  { id: "200-250", label: "200–250m", max: 250 },
  { id: "250-300", label: "250–300m", max: 300 },
  { id: "gte300", label: "300m 이상", max: Infinity },
] as const;

export function lengthBucket(lengthM: number): string | null {
  if (!(lengthM > 0)) return null;
  return LENGTH_BUCKETS.find((b) => lengthM < b.max)!.id;
}

export function inBox(p: { lat: number; lon: number }, box: AisGate["box"]) {
  const [[s, w], [n, e]] = box;
  return p.lat >= s && p.lat <= n && p.lon >= w && p.lon <= e;
}

export function directionOf(cog: number, gate: AisGate): string | null {
  if (!(cog >= 0 && cog < 360)) return null;
  for (const d of gate.directions) {
    if ((cog >= d.from && cog < d.to) || (cog + 360 >= d.from && cog + 360 < d.to)) return d.id;
  }
  return null;
}

export interface GateCount {
  gateId: string;
  /** 항해 중(SOG ≥ 1kn) 탱커 — 방향별 */
  underway: Record<string, number>;
  /** 저속·정박(SOG < 1kn) 탱커 */
  slow: number;
  /** 길이 구간별 탱커(항해·정박 합) */
  byLength: Record<string, number>;
  /** 상자 안 전체 선박 중 선종을 아직 모르는 척수 */
  unknownType: number;
  /** 상자 안 수신 선박 전체 */
  total: number;
}

/** MMSI별 마지막 위치만 쓴다(같은 배 중복 집계 방지) */
export function aggregateGates(positions: AisPosition[], statics: Record<string, AisStatic>, gates: AisGate[]): GateCount[] {
  const last = new Map<number, AisPosition>();
  for (const p of positions) {
    const prev = last.get(p.mmsi);
    if (!prev || prev.at < p.at) last.set(p.mmsi, p);
  }
  return gates.map((gate) => {
    const c: GateCount = { gateId: gate.id, underway: Object.fromEntries(gate.directions.map((d) => [d.id, 0])), slow: 0, byLength: {}, unknownType: 0, total: 0 };
    for (const p of last.values()) {
      if (!inBox(p, gate.box)) continue;
      c.total++;
      const st = statics[String(p.mmsi)];
      if (!st) {
        c.unknownType++;
        continue;
      }
      if (!isTanker(st.type)) continue;
      const bucket = lengthBucket(st.lengthM);
      if (bucket) c.byLength[bucket] = (c.byLength[bucket] ?? 0) + 1;
      if (p.sog < 1) {
        c.slow++;
        continue;
      }
      const dir = directionOf(p.cog, gate);
      if (dir) c.underway[dir]++;
    }
    return c;
  });
}

/** 정적 정보 캐시 병합 + 오래된 항목 정리 */
export function mergeStatics(prev: Record<string, AisStatic>, next: Record<string, AisStatic>, now: Date, maxAgeDays = 30) {
  const cutoff = new Date(now.getTime() - maxAgeDays * 86400_000).toISOString();
  const out: Record<string, AisStatic> = {};
  for (const [k, v] of Object.entries({ ...prev, ...next })) if (v.at >= cutoff) out[k] = v;
  return out;
}
