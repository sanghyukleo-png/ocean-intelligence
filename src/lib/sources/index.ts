import { aisstreamSource } from "./aisstream";
import { ecosSource } from "./ecos";
import { eiaSource } from "./eia";
import { frankfurterSource } from "./frankfurter";
import { kmaApiHubSource, kmaMidSeaSource, kmaWarningsSource } from "./kma";
import { koreaEximSource } from "./koreaexim";
import type { SourceDef } from "./types";

// 수집 불가로 판정된 지표 — 화면에 가짜 값을 넣지 않고 /status와 보고서(docs/data-sources.md)에 사유를 남긴다.
const blocked = (def: Omit<SourceDef, "availability" | "minIntervalSec" | "retryIntervalSec" | "staleAfterSec">): SourceDef => ({
  ...def,
  availability: "blocked",
  minIntervalSec: 86400,
  retryIntervalSec: 86400,
  staleAfterSec: 86400,
});

export const SOURCES: SourceDef[] = [
  eiaSource,
  koreaEximSource,
  ecosSource,
  frankfurterSource,
  kmaWarningsSource,
  kmaMidSeaSource,
  kmaApiHubSource,
  aisstreamSource,
  blocked({
    id: "dubai",
    name: "Dubai 원유",
    label: "Dubai",
    sourceUrl: "https://www.gulfmerc.com/gme-product-services/gme-data",
    provides: ["dubai"],
    envKeys: [],
    cadence: "일간",
    note: "일간 Dubai는 Platts 평가(수집 금지). GME Oman 정산가는 T+1 공개되나 제3자 제공은 GME/CME 정보이용계약(ILA) 필요. 무료 대안은 IMF 월평균뿐(임의 대체 금지) — 사용자 결정 대기",
    terms: "라이선스 필요",
  }),
  blocked({
    id: "bunker",
    name: "벙커유 (싱가포르·부산 VLSFO)",
    label: "벙커유",
    sourceUrl: "https://www.bunkerindex.com/",
    provides: ["vlsfo-sg", "vlsfo-busan"],
    envKeys: [],
    cadence: "일 1회~수회",
    note: "약관이 수집·재게시를 허용하는 무료 공개 사이트를 찾지 못함(Ship & Bunker 금지, OilPriceAPI 게시권 없음, 그 외 약관 미확인). 표시권 포함 라이선스 견적 또는 사용자 입력으로 운영 — 사용자 결정 대기",
    terms: "라이선스 필요",
  }),
  blocked({
    id: "scfi",
    name: "SCFI (상하이해운거래소)",
    label: "상하이해운거래소",
    sourceUrl: "https://en.sse.net.cn/indices/scfinew.jsp",
    provides: ["scfi"],
    envKeys: [],
    cadence: "주 1회 · 금",
    note: "API·재게시 허용 문구 없음(All Rights Reserved) — SSE 서면 허락 전에는 출처 링크만",
    terms: "서면 허락 필요",
  }),
];

export function sourceById(id: string) {
  return SOURCES.find((s) => s.id === id) ?? null;
}

export function missingKeys(def: SourceDef, env: Record<string, string | undefined>) {
  return def.envKeys.filter((k) => !env[k]?.trim());
}
