import { aisstreamSource } from "./aisstream";
import { ecosSource } from "./ecos";
import { eiaSource } from "./eia";
import { frankfurterSource } from "./frankfurter";
import { kobcKcciSource, sseScfiSource } from "./freightIndices";
import { imfDubaiSource } from "./imf";
import { kmaApiHubSource, kmaMidSeaSource, kmaWarningsSource } from "./kma";
import { koreaEximSource } from "./koreaexim";
import type { SourceDef } from "./types";

// 벙커유는 사용자 결정(2026-10-08 #2 c)에 따라 수집하지 않는다 — 시황 화면의 직접 입력 값만 계산기에 쓴다.

export const SOURCES: SourceDef[] = [
  eiaSource,
  koreaEximSource,
  ecosSource,
  frankfurterSource,
  kmaWarningsSource,
  kmaMidSeaSource,
  kmaApiHubSource,
  aisstreamSource,
  imfDubaiSource,
  sseScfiSource,
  kobcKcciSource,
];

export function sourceById(id: string) {
  return SOURCES.find((s) => s.id === id) ?? null;
}

export function missingKeys(def: SourceDef, env: Record<string, string | undefined>) {
  return def.envKeys.filter((k) => !env[k]?.trim());
}
