import type { Observation, RunRecord, Snapshot, SourceStatus } from "@/lib/sources/types";
import { applyRun, emptyStatus, type DataStore } from "./types";

// 저장소 키가 없을 때 쓰는 프로세스 메모리 저장소. 서버리스 인스턴스마다 따로이고 재시작하면 사라진다 —
// /status에 "임시 저장소"로 표시한다. 개발 서버의 HMR에서도 유지되도록 globalThis에 둔다.

const MAX_PER_SERIES = 400;

export function createMemoryStore(): DataStore {
  const series = new Map<string, Observation[]>();
  const snapshots = new Map<string, Snapshot>();
  const statuses = new Map<string, SourceStatus>();

  return {
    kind: "memory",
    async putObservations(obs) {
      for (const o of obs) {
        const key = `${o.metric}|${o.source}`;
        const list = series.get(key) ?? [];
        const i = list.findIndex((x) => x.asOf === o.asOf);
        if (i >= 0) list[i] = o;
        else list.push(o);
        list.sort((a, b) => a.asOf.localeCompare(b.asOf));
        series.set(key, list.slice(-MAX_PER_SERIES));
      }
    },
    async recent(metric, source, limit) {
      return [...(series.get(`${metric}|${source}`) ?? [])].reverse().slice(0, limit);
    },
    async putSnapshot(s) {
      snapshots.set(s.key, s);
    },
    async getSnapshot<T>(key: string) {
      return (snapshots.get(key) as Snapshot<T> | undefined) ?? null;
    },
    async recordRun(run: RunRecord) {
      statuses.set(run.sourceId, applyRun(statuses.get(run.sourceId) ?? emptyStatus(run.sourceId), run));
    },
    async status(sourceId) {
      return statuses.get(sourceId) ?? emptyStatus(sourceId);
    },
  };
}

const g = globalThis as unknown as { __oiMemoryStore?: DataStore };

export function sharedMemoryStore(): DataStore {
  g.__oiMemoryStore ??= createMemoryStore();
  return g.__oiMemoryStore;
}
