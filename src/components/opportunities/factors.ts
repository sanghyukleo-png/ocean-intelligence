import { SCORE_WEIGHTS } from "@/lib/scoring";
import type { ScoreFactors } from "@/types";

/** 점수 요인의 화면 표기. 가중치 값은 scoring.ts의 SCORE_WEIGHTS를 그대로 읽는다. */
export const SCORE_FACTORS: { key: keyof ScoreFactors; label: string; meaning: string }[] = [
  { key: "fleetAge", label: "선령", meaning: "선대가 노후할수록 높음" },
  { key: "orderbookGap", label: "발주잔량 격차", meaning: "선대 대비 발주잔량이 적을수록 높음" },
  { key: "fleetSize", label: "선대 규모", meaning: "선대가 클수록 높음" },
  { key: "fleetGrowth", label: "선대 성장률", meaning: "선대 성장 추세가 빠를수록 높음" },
  { key: "fuelTransition", label: "연료전환", meaning: "대체연료 전환이 활발할수록 높음" },
  { key: "marketCondition", label: "시장 상황", meaning: "세그먼트 시장 여건이 우호적일수록 높음" },
];

export function weightPct(key: keyof ScoreFactors) {
  return Math.round(SCORE_WEIGHTS[key] * 100);
}
