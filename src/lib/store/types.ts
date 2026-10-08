import type { Observation, RunRecord, Snapshot, SourceStatus } from "@/lib/sources/types";

/** 시계열·스냅샷·수집 기록 저장소. Supabase(권장)와 메모리(키 없을 때 임시) 두 구현. */
export interface DataStore {
  kind: "supabase" | "memory";
  /** 같은 (metric, source, asOf)는 덮어쓴다 */
  putObservations(obs: Observation[]): Promise<void>;
  /** 최신순 */
  recent(metric: string, source: string, limit: number): Promise<Observation[]>;
  putSnapshot(s: Snapshot): Promise<void>;
  getSnapshot<T>(key: string): Promise<Snapshot<T> | null>;
  recordRun(run: RunRecord): Promise<void>;
  status(sourceId: string): Promise<SourceStatus>;
}

export function emptyStatus(sourceId: string): SourceStatus {
  return { sourceId, lastAttemptAt: null, lastSuccessAt: null, consecutiveFailures: 0, lastDurationMs: null, lastError: null };
}

/** 수집 기록 하나를 반영해 상태를 갱신 — 두 구현이 같은 규칙을 쓴다 */
export function applyRun(prev: SourceStatus, run: RunRecord): SourceStatus {
  return {
    sourceId: run.sourceId,
    lastAttemptAt: run.finishedAt,
    lastSuccessAt: run.ok ? run.finishedAt : prev.lastSuccessAt,
    consecutiveFailures: run.ok ? 0 : prev.consecutiveFailures + 1,
    lastDurationMs: run.durationMs,
    lastError: run.ok ? prev.lastError : { kind: run.kind ?? "http", message: run.message ?? "", at: run.finishedAt },
  };
}
