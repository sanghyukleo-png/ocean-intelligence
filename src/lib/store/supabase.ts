import type { Observation, RunRecord, Snapshot, SourceStatus } from "@/lib/sources/types";
import { applyRun, emptyStatus, type DataStore } from "./types";

// Supabase(Postgres) 저장소 — PostgREST(REST)로 직접 호출해 SDK 의존성을 두지 않는다.
// 스키마: supabase/migrations/0001_ingest.sql. 서버 전용 비밀 키만 쓴다(RLS로 공개 접근 차단).
// fresh=false(화면 렌더)면 읽기를 60초 캐시해 페이지가 정적·ISR로 남게 하고, 수집기는 fresh=true로 항상 새로 읽는다.

interface Opts {
  url: string;
  key: string;
  fresh: boolean;
  fetch?: typeof fetch;
}

export function createSupabaseStore({ url, key, fresh, fetch: f = fetch }: Opts): DataStore {
  const base = `${url.replace(/\/$/, "")}/rest/v1`;
  const headers = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };

  async function get<T>(path: string): Promise<T> {
    const res = await f(`${base}/${path}`, {
      headers,
      ...(fresh ? { cache: "no-store" as const } : { next: { revalidate: 60, tags: ["oi-data"] } }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`Supabase ${res.status}`);
    return (await res.json()) as T;
  }

  async function upsert(table: string, conflict: string, rows: unknown[]) {
    if (!rows.length) return;
    const res = await f(`${base}/${table}?on_conflict=${conflict}`, {
      method: "POST",
      headers: { ...headers, Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(rows),
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`Supabase ${table} ${res.status}`);
  }

  const enc = encodeURIComponent;

  return {
    kind: "supabase",
    async putObservations(obs) {
      await upsert(
        "observations",
        "metric,source,as_of",
        obs.map((o) => ({ metric: o.metric, source: o.source, as_of: o.asOf, as_of_precision: o.asOfPrecision, value: o.value, unit: o.unit, fetched_at: o.fetchedAt, source_url: o.sourceUrl }))
      );
    },
    async recent(metric, source, limit) {
      type Row = { metric: string; source: string; as_of: string; as_of_precision: "day" | "minute"; value: number; unit: string; fetched_at: string; source_url: string };
      const rows = await get<Row[]>(`observations?metric=eq.${enc(metric)}&source=eq.${enc(source)}&order=as_of.desc&limit=${limit}`);
      return rows.map(
        (r): Observation => ({ metric: r.metric, source: r.source, asOf: r.as_of, asOfPrecision: r.as_of_precision, value: Number(r.value), unit: r.unit, fetchedAt: r.fetched_at, sourceUrl: r.source_url })
      );
    },
    async putSnapshot(s) {
      await upsert("snapshots", "key", [{ key: s.key, data: s.data, as_of: s.asOf, fetched_at: s.fetchedAt, source: s.source, source_url: s.sourceUrl }]);
    },
    async getSnapshot<T>(key: string) {
      type Row = { key: string; data: T; as_of: string; fetched_at: string; source: string; source_url: string };
      const rows = await get<Row[]>(`snapshots?key=eq.${enc(key)}&limit=1`);
      const r = rows[0];
      return r ? ({ key: r.key, data: r.data, asOf: r.as_of, fetchedAt: r.fetched_at, source: r.source, sourceUrl: r.source_url } as Snapshot<T>) : null;
    },
    async recordRun(run: RunRecord) {
      const prev = await this.status(run.sourceId);
      const next = applyRun(prev, run);
      await upsert("source_runs", "id", [
        { source_id: run.sourceId, started_at: run.startedAt, finished_at: run.finishedAt, ok: run.ok, duration_ms: run.durationMs, kind: run.kind ?? null, message: run.message ?? null, accepted: run.accepted, rejected: run.rejected },
      ]);
      await upsert("source_status", "source_id", [
        {
          source_id: next.sourceId,
          last_attempt_at: next.lastAttemptAt,
          last_success_at: next.lastSuccessAt,
          consecutive_failures: next.consecutiveFailures,
          last_duration_ms: next.lastDurationMs,
          last_error: next.lastError,
        },
      ]);
    },
    async status(sourceId): Promise<SourceStatus> {
      type Row = { source_id: string; last_attempt_at: string | null; last_success_at: string | null; consecutive_failures: number; last_duration_ms: number | null; last_error: SourceStatus["lastError"] };
      const rows = await get<Row[]>(`source_status?source_id=eq.${enc(sourceId)}&limit=1`);
      const r = rows[0];
      if (!r) return emptyStatus(sourceId);
      return {
        sourceId,
        lastAttemptAt: r.last_attempt_at,
        lastSuccessAt: r.last_success_at,
        consecutiveFailures: r.consecutive_failures,
        lastDurationMs: r.last_duration_ms,
        lastError: r.last_error,
      };
    },
  };
}
