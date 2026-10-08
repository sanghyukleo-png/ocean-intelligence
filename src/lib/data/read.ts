import type { DataGrade, DataProvenance } from "@/components/ui/badge";
import { KMA_PORTS } from "@/data/kmaPortZones";
import type { WarningStatus } from "@/lib/kma/warnings";
import { evaluatePortRisk, type Feed, type MidSeaDay, type PortRisk } from "@/lib/portRisk";
import { SOURCES, missingKeys, sourceById } from "@/lib/sources";
import { KMA_MIDSEA_KEY, KMA_WARNINGS_KEY, type MidSeaRegion } from "@/lib/sources/kma";
import { AIS_GATES_KEY, type AisGatesSnapshot } from "@/lib/sources/aisstream";
import type { Observation, Snapshot, SourceDef } from "@/lib/sources/types";
import type { DataStore } from "@/lib/store";

// 저장소 → 화면. 등급 규칙(지시서 3장·11장):
//   live    값 있음 + 마지막 수집 성공
//   stale   값 있음 + 이후 수집 실패(마지막 성공값·시각·사유) / 값 없음 + 실패
//   nokey   필요한 키가 없어 수집하지 않음
//   pending 소스 미확보(약관·명세) 또는 첫 수집 전 — 값을 비운다. DEMO는 쓰지 않는다

export interface MetricDef {
  id: string;
  label: string;
  unit: string;
  decimals: number;
  /** 우선순위 순 소스 id */
  sources: string[];
}

export const METRICS: MetricDef[] = [
  { id: "brent", label: "Brent", unit: "$/bbl", decimals: 2, sources: ["eia"] },
  { id: "wti", label: "WTI", unit: "$/bbl", decimals: 2, sources: ["eia"] },
  // 일간 Dubai는 Platts라 수집 금지 → IMF 월평균을 "월평균"으로 명시(사용자 결정 2026-10-08)
  { id: "dubai", label: "Dubai 월평균", unit: "$/bbl", decimals: 2, sources: ["imf-pcps"] },
  { id: "usdkrw", label: "USD/KRW", unit: "원", decimals: 2, sources: ["koreaexim", "ecos", "frankfurter-ecb"] },
  { id: "scfi", label: "SCFI", unit: "pt", decimals: 2, sources: ["sse-scfi"] },
  { id: "kcci", label: "KCCI", unit: "pt", decimals: 0, sources: ["kobc-kcci"] },
];

export interface MetricReading {
  id: string;
  value: number | null;
  changePct: number | null;
  grade: DataGrade;
  provenance: DataProvenance;
  /** 최근 값(오래된 순) — 추이 차트용 */
  series: Observation[];
}

type Env = Record<string, string | undefined>;

function provenanceOf(def: SourceDef, o: Observation | null, extra: Partial<DataProvenance> = {}): DataProvenance {
  return {
    source: def.label,
    sourceUrl: def.sourceUrl,
    cadence: def.cadence,
    ...(o ? { asOf: o.asOf, asOfPrecision: o.asOfPrecision, fetchedAt: o.fetchedAt } : {}),
    ...extra,
  };
}

export async function readMetric(store: DataStore, id: string, env: Env = process.env, seriesLength = 30): Promise<MetricReading> {
  const metric = METRICS.find((m) => m.id === id);
  if (!metric) throw new Error(`unknown metric ${id}`);
  const empty = { id, value: null, changePct: null, series: [] as Observation[] };
  const defs = metric.sources.map(sourceById).filter((d): d is SourceDef => !!d);
  let firstFailure: MetricReading | null = null;
  let anyNoKey: SourceDef | null = null;
  let firstPending: SourceDef | null = null;
  let waiting: SourceDef | null = null;

  for (const def of defs) {
    if (def.availability !== "ready") {
      firstPending ??= def;
      continue;
    }
    if (missingKeys(def, env).length) {
      anyNoKey ??= def;
      continue;
    }
    const [recent, status] = await Promise.all([store.recent(id, def.id, seriesLength), store.status(def.id)]);
    const latest = recent[0] ?? null;
    const failing = status.consecutiveFailures > 0 && status.lastError;
    if (latest) {
      const prev = recent[1] ?? null;
      return {
        id,
        value: latest.value,
        changePct: prev ? ((latest.value - prev.value) / prev.value) * 100 : null,
        grade: failing ? "stale" : "live",
        provenance: provenanceOf(def, latest, failing ? { error: status.lastError!.message } : {}),
        series: [...recent].reverse(),
      };
    }
    if (failing && !firstFailure) {
      firstFailure = { ...empty, grade: "stale", provenance: provenanceOf(def, null, { error: status.lastError!.message }) };
    }
    if (!failing) waiting ??= def; // 키는 있으나 첫 수집 전
  }
  if (firstFailure) return firstFailure;
  if (waiting) return { ...empty, grade: "pending", provenance: { source: waiting.label, cadence: "첫 수집 대기" } };
  if (anyNoKey) {
    return { ...empty, grade: "nokey", provenance: { source: anyNoKey.label, cadence: anyNoKey.cadence, error: `${missingKeys(anyNoKey, env).join(", ")} 미설정` } };
  }
  return { ...empty, grade: "pending", provenance: { cadence: firstPending?.availability === "blocked" ? "소스 미확보" : "소스 검토 중" } };
}

/** 스냅샷 하나를 Feed로 — portRisk 입력용 */
async function feedOf<T, R = T>(store: DataStore, key: string, sourceId: string, env: Env, map?: (d: T) => R): Promise<Feed<R>> {
  const def = sourceById(sourceId)!;
  if (def.availability !== "ready") return { state: "unavailable", reason: def.note ?? "" };
  if (missingKeys(def, env).length) return { state: "nokey" };
  const [snap, status] = await Promise.all([store.getSnapshot<T>(key), store.status(sourceId)]);
  if (status.consecutiveFailures > 0 || !snap) {
    return { state: "failed", lastSuccessAt: status.lastSuccessAt, error: status.lastError?.message ?? "첫 수집 대기" };
  }
  return { state: "ok", data: map ? map(snap.data) : (snap.data as unknown as R), asOf: snap.asOf, fetchedAt: snap.fetchedAt };
}

export interface PortRiskBoard {
  ports: (PortRisk & { name: string; refinery: boolean })[];
  warnings: Feed<WarningStatus>;
  warningsSnapshot: Snapshot<WarningStatus> | null;
}

export async function readPortRisks(store: DataStore, env: Env = process.env, now = new Date()): Promise<PortRiskBoard> {
  const warnings = await feedOf<WarningStatus>(store, KMA_WARNINGS_KEY, "kma-warnings", env);
  const midRegions = await feedOf<MidSeaRegion[]>(store, KMA_MIDSEA_KEY, "kma-midsea", env);
  const shortTerm = { state: "unavailable", reason: sourceById("kma-apihub")?.note ?? "" } as const;
  const ports = KMA_PORTS.map((port) => {
    const midSea: Feed<MidSeaDay[]> =
      midRegions.state === "ok"
        ? { ...midRegions, data: midRegions.data.find((r) => r.regId === port.midSeaRegId)?.days ?? [] }
        : midRegions;
    const risk = evaluatePortRisk({ now, port, warnings, midSea, shortTerm, typhoonNear: shortTerm });
    return { ...risk, name: port.name, refinery: port.refinery };
  });
  const warningsSnapshot = warnings.state === "ok" ? await store.getSnapshot<WarningStatus>(KMA_WARNINGS_KEY) : null;
  return { ports, warnings, warningsSnapshot };
}

/** 초크포인트 AIS 집계(지시서 11.3) */
export function readAisGates(store: DataStore, env: Env = process.env): Promise<Feed<AisGatesSnapshot>> {
  return feedOf<AisGatesSnapshot>(store, AIS_GATES_KEY, "aisstream", env);
}

export { SOURCES };
