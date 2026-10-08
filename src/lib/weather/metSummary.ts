import type { MetPoint } from "@/lib/sources/openMeteo";

// Open-Meteo 72시간 예보 요약(순수 함수) — 항만 표·해협 칩에 쓴다.
// 임계값은 지시서 5.6 기본 예(풍속 25kt·파고 2.0m)이며 사용자가 바꿀 수 있다. 저시정은 1해리(1,852m) 미만.
// 도선·접안 중단 기준은 항만·터미널 규정이 정한다 — 이 요약은 판단 보조다.

export interface MetThresholds {
  windKt: number;
  waveM: number;
  visM: number;
}

export const DEFAULT_MET_THRESHOLDS: MetThresholds = { windKt: 25, waveM: 2.0, visM: 1852 };

export interface MetSummary {
  /** 지금 시점(첫 시간) 값 */
  now: { windKt: number | null; gustKt: number | null; dirDeg: number | null; waveM: number | null; at: string | null };
  maxWindKt: number | null;
  maxGustKt: number | null;
  maxWaveM: number | null;
  minVisM: number | null;
  /** 0–24·24–48·48–72시간 구간별 임계 초과 시간 수 */
  exceedHours: [number, number, number];
  /** 처음 임계를 넘는 시각과 항목 */
  firstExceed: { at: string; what: string[] } | null;
}

const max = (a: (number | null)[]) => a.reduce<number | null>((m, v) => (v === null ? m : m === null ? v : Math.max(m, v)), null);
const min = (a: (number | null)[]) => a.reduce<number | null>((m, v) => (v === null ? m : m === null ? v : Math.min(m, v)), null);

export function summarizeMet(p: MetPoint, t: MetThresholds = DEFAULT_MET_THRESHOLDS): MetSummary {
  const exceedHours: [number, number, number] = [0, 0, 0];
  let firstExceed: MetSummary["firstExceed"] = null;
  p.times.forEach((at, i) => {
    const what: string[] = [];
    const w = p.windKt[i];
    const h = p.waveM[i];
    const v = p.visM[i];
    if (w !== null && w >= t.windKt) what.push("풍속");
    if (h !== null && h >= t.waveM) what.push("파고");
    if (v !== null && v < t.visM) what.push("저시정");
    if (!what.length) return;
    exceedHours[Math.min(2, Math.floor(i / 24))]++;
    firstExceed ??= { at, what };
  });
  return {
    now: { windKt: p.windKt[0] ?? null, gustKt: p.gustKt[0] ?? null, dirDeg: p.dirDeg[0] ?? null, waveM: p.waveM[0] ?? null, at: p.times[0] ?? null },
    maxWindKt: max(p.windKt),
    maxGustKt: max(p.gustKt),
    maxWaveM: max(p.waveM),
    minVisM: min(p.visM),
    exceedHours,
    firstExceed,
  };
}

/** 풍향(°) → 16방위 */
export function compass(deg: number | null): string {
  if (deg === null) return "—";
  const names = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return names[Math.round((((deg % 360) + 360) % 360) / 22.5) % 16];
}
