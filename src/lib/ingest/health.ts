import { SOURCES, missingKeys } from "@/lib/sources";
import type { SourceDef, SourceStatus } from "@/lib/sources/types";
import type { DataStore } from "@/lib/store";
import { nextDueAt } from "./run";

// /status 페이지와 헤더 상태 점이 쓰는 소스 건강 상태(순수 판정 + 저장소 조회)

export type Health = "ok" | "delayed" | "failed" | "waiting" | "nokey" | "needs-spec" | "blocked";

export const HEALTH_LABEL: Record<Health, string> = {
  ok: "정상",
  delayed: "지연",
  failed: "실패",
  waiting: "첫 수집 대기",
  nokey: "API 키 미설정",
  "needs-spec": "명세 확인 필요",
  blocked: "소스 미확보",
};

export function healthOf(def: SourceDef, status: SourceStatus, env: Record<string, string | undefined>, now: Date): Health {
  if (def.availability === "blocked") return "blocked";
  if (def.availability === "needs-spec") return "needs-spec";
  if (missingKeys(def, env).length) return "nokey";
  if (status.consecutiveFailures > 0) return "failed";
  if (!status.lastSuccessAt) return "waiting";
  const age = (now.getTime() - new Date(status.lastSuccessAt).getTime()) / 1000;
  return age > def.staleAfterSec ? "delayed" : "ok";
}

export type Overall = "ok" | "delayed" | "failed" | "unconfigured";

/** 헤더 점: 수집 중인(키 있는) 소스 중 가장 나쁜 상태. 수집 중인 소스가 없으면 unconfigured */
export function overallOf(healths: Health[]): Overall {
  const active = healths.filter((h) => h === "ok" || h === "delayed" || h === "failed" || h === "waiting");
  if (!active.length) return "unconfigured";
  if (active.includes("failed")) return "failed";
  if (active.includes("delayed") || active.includes("waiting")) return "delayed";
  return "ok";
}

export interface SourceRow {
  def: SourceDef;
  status: SourceStatus;
  health: Health;
  missing: string[];
  nextAt: string | null;
}

export async function readSourceRows(store: DataStore, env: Record<string, string | undefined> = process.env, now = new Date()): Promise<SourceRow[]> {
  return Promise.all(
    SOURCES.map(async (def) => {
      const status = await store.status(def.id);
      const next = def.availability === "ready" ? nextDueAt(def, status, now) : null;
      return { def, status, health: healthOf(def, status, env, now), missing: missingKeys(def, env), nextAt: next?.toISOString() ?? null };
    })
  );
}
