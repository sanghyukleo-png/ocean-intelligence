import { SOURCES, missingKeys } from "@/lib/sources";
import { FAILURE_LABEL, SourceError, type Observation, type SourceDef, type SourceStatus } from "@/lib/sources/types";
import type { DataStore } from "@/lib/store";

// 수집 실행기(지시서 11.2): 키 확인 → 최소 간격 → 어댑터 → 값 검증(±30%) → 저장 → 수집 기록.
// 스케줄은 Vercel 플랜과 무관하게 두 경로로 들어온다:
//   ① 요청 시 갱신: 화면·/api/data 렌더 후 after()로 "기한 지난 소스만" 실행(stale-while-revalidate)
//   ② 외부 스케줄러: /api/ingest/[source] (Supabase pg_cron, Vercel cron 등) — 같은 최소 간격 규칙을 따른다

export const MAX_JUMP = 0.3;

export type RunOutcome =
  | { sourceId: string; status: "ok"; accepted: number; rejected: number; warnings: string[]; durationMs: number }
  | { sourceId: string; status: "failed"; kind: string; message: string; durationMs: number }
  | { sourceId: string; status: "skipped"; nextAt: string }
  | { sourceId: string; status: "nokey"; missing: string[] }
  | { sourceId: string; status: "unavailable"; reason: string };

/** 저장 전 값 검증. 문제가 있으면 사유, 없으면 null */
export function validateObservation(prev: Observation | null, next: Observation, maxJump = MAX_JUMP): string | null {
  if (!Number.isFinite(next.value) || next.value <= 0) return `${next.metric} ${next.asOf}: 0 이하이거나 숫자가 아님`;
  if (prev && Math.abs(next.value / prev.value - 1) >= maxJump) {
    return `${next.metric} ${next.asOf}: 직전(${prev.asOf}) ${prev.value} 대비 ${(((next.value / prev.value) - 1) * 100).toFixed(1)}% — ±${Math.round(maxJump * 100)}% 이상 변동이라 저장하지 않음`;
  }
  return null;
}

/**
 * 한 시계열(오래된 순)을 검증한다.
 * 급변 값은 일단 보류하고, 바로 다음 값이 보류 값과 허용 범위 안이면 수준 변화가 확인된 것으로 보고 둘 다 받는다
 * (한 번 거른 값 때문에 이후 값이 계속 거부되는 것을 막는다). 마지막 값이 보류로 끝나면 latestRejected=true.
 */
export function validateSeries(stored: Observation | null, list: Observation[], maxJump = MAX_JUMP) {
  const accepted: Observation[] = [];
  const rejected: string[] = [];
  let prev = stored;
  let pending: { obs: Observation; reason: string } | null = null;
  for (const o of list) {
    const problem = validateObservation(prev, o, maxJump);
    if (!problem) {
      if (pending) rejected.push(pending.reason);
      pending = null;
      accepted.push(o);
      prev = o;
      continue;
    }
    if (pending && !validateObservation(pending.obs, o, maxJump)) {
      accepted.push(pending.obs, o);
      prev = o;
      pending = null;
      continue;
    }
    if (pending) rejected.push(pending.reason);
    pending = { obs: o, reason: problem };
  }
  if (pending) rejected.push(pending.reason);
  return { accepted, rejected, latestRejected: pending !== null };
}

/** 다음 수집 가능 시각. null이면 지금 가능 */
export function nextDueAt(def: SourceDef, status: SourceStatus, now: Date): Date | null {
  if (!status.lastAttemptAt) return null;
  const interval = status.consecutiveFailures > 0 ? def.retryIntervalSec : def.minIntervalSec;
  const due = new Date(new Date(status.lastAttemptAt).getTime() + interval * 1000);
  return due > now ? due : null;
}

const g = globalThis as unknown as { __oiIngestLocks?: Map<string, Promise<RunOutcome>> };
const locks = (g.__oiIngestLocks ??= new Map());

export interface RunOptions {
  store: DataStore;
  env?: Record<string, string | undefined>;
  now?: Date;
  fetch?: typeof fetch;
  force?: boolean;
}

/** 시험용 강제 실패: INGEST_SIMULATE_FAILURE=frankfurter-ecb,eia (11.7 "소스 하나를 일부러 실패") */
function simulated(env: Record<string, string | undefined>, id: string) {
  return (env.INGEST_SIMULATE_FAILURE ?? "").split(",").map((s) => s.trim()).includes(id);
}

export function runSource(def: SourceDef, opts: RunOptions): Promise<RunOutcome> {
  const running = locks.get(def.id);
  if (running) return running;
  const p = runSourceInner(def, opts).finally(() => locks.delete(def.id));
  locks.set(def.id, p);
  return p;
}

async function runSourceInner(def: SourceDef, { store, env = process.env, now = new Date(), fetch: f = fetch, force = false }: RunOptions): Promise<RunOutcome> {
  if (def.availability !== "ready" || !def.collect) {
    return { sourceId: def.id, status: "unavailable", reason: def.note ?? "수집 불가" };
  }
  const missing = missingKeys(def, env);
  if (missing.length) return { sourceId: def.id, status: "nokey", missing };

  const status = await store.status(def.id);
  const due = force ? null : nextDueAt(def, status, now);
  if (due) return { sourceId: def.id, status: "skipped", nextAt: due.toISOString() };

  const started = Date.now();
  const startedAt = new Date(started).toISOString();
  const finish = () => ({ finishedAt: new Date().toISOString(), durationMs: Date.now() - started });

  try {
    if (simulated(env, def.id)) throw new SourceError("network", "시험용 강제 실패(INGEST_SIMULATE_FAILURE)");
    const result = await def.collect({ env, now, fetch: f, getSnapshot: (k) => store.getSnapshot(k) });

    const accepted: Observation[] = [];
    const rejected: string[] = [];
    let latestRejected = false;
    const groups = new Map<string, Observation[]>();
    // 저장 키는 소스 id — 표시용 이름은 SourceDef.label
    for (const raw of result.observations ?? []) {
      const o = { ...raw, source: def.id };
      const k = `${o.metric}|${o.source}`;
      groups.set(k, [...(groups.get(k) ?? []), o]);
    }
    for (const list of groups.values()) {
      list.sort((a, b) => a.asOf.localeCompare(b.asOf));
      const stored = await store.recent(list[0].metric, list[0].source, 10);
      const before = stored.find((s) => s.asOf < list[0].asOf) ?? null;
      const r = validateSeries(before, list, def.maxJump);
      accepted.push(...r.accepted);
      rejected.push(...r.rejected);
      latestRejected ||= r.latestRejected;
    }

    await store.putObservations(accepted);
    for (const s of result.snapshots ?? []) await store.putSnapshot(s);
    // 최신 값이 검증에서 걸렸으면 앞선 값은 저장하되 실패로 기록 → 화면은 "수집 실패 · 마지막 성공값"
    if (latestRejected || (result.observations?.length && !accepted.length)) throw new SourceError("invalid", rejected.join(" / "));

    const warnings = [...rejected, ...(result.warnings ?? [])];
    if (rejected.length) console.warn(`[ingest] ${def.id} 검증 제외 ${rejected.length}건:`, rejected.join(" / "));
    const t = finish();
    await store.recordRun({ sourceId: def.id, startedAt, ...t, ok: true, accepted: accepted.length + (result.snapshots?.length ?? 0), rejected: rejected.length, message: warnings.join(" / ") || undefined });
    return { sourceId: def.id, status: "ok", accepted: accepted.length, rejected: rejected.length, warnings, durationMs: t.durationMs };
  } catch (e) {
    const err = e instanceof SourceError ? e : new SourceError("parse", e instanceof Error ? e.message : "알 수 없는 오류");
    const message = `${FAILURE_LABEL[err.kind]} — ${err.message}`;
    console.warn(`[ingest] ${def.id} 실패: ${message}`);
    const t = finish();
    try {
      await store.recordRun({ sourceId: def.id, startedAt, ...t, ok: false, kind: err.kind, message, accepted: 0, rejected: 0 });
    } catch (storeErr) {
      console.error(`[ingest] ${def.id} 수집 기록 저장 실패`, storeErr);
    }
    return { sourceId: def.id, status: "failed", kind: err.kind, message, durationMs: t.durationMs };
  }
}

/** 기한이 지난 소스만 실행(요청 시 갱신). ids를 주면 그 소스만. */
export async function refreshDue(
  store: DataStore,
  ids?: string[],
  opts: Omit<RunOptions, "store"> & { onRequest?: boolean } = {}
): Promise<RunOutcome[]> {
  const targets = SOURCES.filter(
    (s) => s.availability === "ready" && (!ids || ids.includes(s.id)) && !(opts.onRequest && s.onRequest === false)
  );
  const settled = await Promise.allSettled(targets.map((def) => runSource(def, { ...opts, store })));
  return settled.map((r, i) =>
    r.status === "fulfilled" ? r.value : { sourceId: targets[i].id, status: "failed", kind: "parse", message: String(r.reason), durationMs: 0 }
  );
}
