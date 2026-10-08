import { AIS_GATES } from "@/data/geo/aisAreas";
import { KMA_PORTS } from "@/data/kmaPortZones";
import { OVERSEAS_PORTS } from "@/data/overseasPorts";
import { fetchSource, readJson, isRecord } from "./http";
import { SourceError, type SourceDef } from "./types";

// 항만·해협 72시간 기상 — Open-Meteo Forecast(바람·시정) + Marine(파고·너울). 키 불필요.
// 지시서 11.4: 국내 위험 등급은 기상청 특보·예보로만 산출하고 Open-Meteo는 보조(시간별 곡선·해외 항만)로 쓴다.
// 약관(open-meteo.com/en/terms): 비상업적 이용 무료, 일 10,000회 이하, CC BY 4.0 출처 표기 — 이 사이트는 비상업 포트폴리오.
// 명세(2026-10-08 실호출): 위경도를 쉼표로 여러 개 넘기면 지점별 객체 배열을 돌려준다.
//   Forecast: hourly=wind_speed_10m,wind_gusts_10m,wind_direction_10m,visibility, wind_speed_unit=kn, cell_selection=sea
//   Marine:   hourly=wave_height,swell_wave_height — 육지 좌표는 가장 가까운 해상 격자로 잡힌다(응답 latitude/longitude가 실제 격자).

const FORECAST = "https://api.open-meteo.com/v1/forecast";
const MARINE = "https://marine-api.open-meteo.com/v1/marine";
export const OPEN_METEO_KEY = "openmeteo.points";
const HOURS = 72;

export interface MetPoint {
  id: string;
  kind: "kr" | "overseas" | "gate";
  /** 실제 계산 격자 [위도, 경도] */
  windGrid: [number, number];
  marineGrid: [number, number] | null;
  /** UTC ISO 시각(정시) */
  times: string[];
  windKt: (number | null)[];
  gustKt: (number | null)[];
  dirDeg: (number | null)[];
  visM: (number | null)[];
  waveM: (number | null)[];
  swellM: (number | null)[];
}

export interface MetSnapshot {
  points: MetPoint[];
}

export const MET_TARGETS: { id: string; kind: MetPoint["kind"]; coord: [number, number] }[] = [
  ...KMA_PORTS.map((p) => ({ id: p.id, kind: "kr" as const, coord: p.coord })),
  ...OVERSEAS_PORTS.map((p) => ({ id: p.id, kind: "overseas" as const, coord: p.coord })),
  // 해협은 집계 상자의 중심(본 사이트 정의 — src/data/geo/aisAreas.ts)
  ...AIS_GATES.map((g) => ({
    id: g.id,
    kind: "gate" as const,
    coord: [(g.box[0][1] + g.box[1][1]) / 2, (g.box[0][0] + g.box[1][0]) / 2] as [number, number],
  })),
];

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function series(h: Record<string, unknown>, key: string): (number | null)[] {
  const arr = h[key];
  return Array.isArray(arr) ? arr.map(num) : [];
}

/** 두 응답 배열을 지점 순서대로 합친다 */
export function parseOpenMeteo(forecast: unknown, marine: unknown, targets = MET_TARGETS): MetPoint[] {
  const f = Array.isArray(forecast) ? forecast : [forecast];
  const m = Array.isArray(marine) ? marine : [marine];
  if (f.length !== targets.length) throw new SourceError("parse", `예보 지점 수 ${f.length} ≠ ${targets.length}`);
  return targets.map((t, i) => {
    const fi = f[i];
    if (!isRecord(fi) || !isRecord(fi.hourly) || !Array.isArray(fi.hourly.time)) throw new SourceError("parse", `${t.id} 예보 hourly 없음`);
    const mi = isRecord(m[i]) ? m[i] : null;
    const mh = mi && isRecord(mi.hourly) ? mi.hourly : {};
    const times = (fi.hourly.time as string[]).map((s) => `${s}:00Z`);
    return {
      id: t.id,
      kind: t.kind,
      windGrid: [Number(fi.latitude), Number(fi.longitude)],
      marineGrid: mi ? [Number(mi.latitude), Number(mi.longitude)] : null,
      times,
      windKt: series(fi.hourly, "wind_speed_10m"),
      gustKt: series(fi.hourly, "wind_gusts_10m"),
      dirDeg: series(fi.hourly, "wind_direction_10m"),
      visM: series(fi.hourly, "visibility"),
      waveM: series(mh, "wave_height"),
      swellM: series(mh, "swell_wave_height"),
    };
  });
}

export const openMeteoSource: SourceDef = {
  id: "open-meteo",
  name: "Open-Meteo 항만·해협 72시간 예보",
  label: "Open-Meteo",
  sourceUrl: "https://open-meteo.com/",
  provides: [OPEN_METEO_KEY],
  envKeys: [],
  availability: "ready",
  cadence: "모델 갱신 시간별",
  minIntervalSec: 60 * 60,
  retryIntervalSec: 15 * 60,
  staleAfterSec: 6 * 3600,
  terms: "비상업 무료 · 일 10,000회 · CC BY 4.0 출처 표기",
  async collect({ now, fetch }) {
    const lat = MET_TARGETS.map((t) => t.coord[1].toFixed(3)).join(",");
    const lon = MET_TARGETS.map((t) => t.coord[0].toFixed(3)).join(",");
    const common = `latitude=${lat}&longitude=${lon}&forecast_days=4&timezone=UTC`;
    const [fr, mr] = await Promise.all([
      fetchSource(fetch, `${FORECAST}?${common}&hourly=wind_speed_10m,wind_gusts_10m,wind_direction_10m,visibility&wind_speed_unit=kn&cell_selection=sea`, { timeoutMs: 20000 }),
      fetchSource(fetch, `${MARINE}?${common}&hourly=wave_height,swell_wave_height`, { timeoutMs: 20000 }),
    ]);
    const all = parseOpenMeteo(await readJson(fr), await readJson(mr));
    // 지금 시각 이후 72시간만 남긴다
    const startIdx = Math.max(0, all[0].times.findIndex((t) => new Date(t).getTime() >= now.getTime() - 3600_000));
    const points = all.map((p) => {
      // 해상 격자가 없으면(만 안쪽 등) 파고 배열이 비어 있다 — 시간 축 길이에 맞춰 null로 채운다
      const cut = (a: (number | null)[]) => p.times.slice(startIdx, startIdx + HOURS).map((_, i) => a[startIdx + i] ?? null);
      return { ...p, times: p.times.slice(startIdx, startIdx + HOURS), windKt: cut(p.windKt), gustKt: cut(p.gustKt), dirDeg: cut(p.dirDeg), visM: cut(p.visM), waveM: cut(p.waveM), swellM: cut(p.swellM) };
    });
    const fetchedAt = now.toISOString();
    return {
      snapshots: [{ key: OPEN_METEO_KEY, data: { points } satisfies MetSnapshot, asOf: points[0]?.times[0] ?? fetchedAt, fetchedAt, source: "Open-Meteo", sourceUrl: "https://open-meteo.com/" }],
    };
  },
};
