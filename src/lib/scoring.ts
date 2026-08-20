import { Opportunity, OpportunityTier, ScoredOpportunity } from "@/types";

// ─────────────────────────────────────────────────────────────────────────
// 결정론적 영업기회 스코어링 엔진 (DETERMINISTIC OPPORTUNITY SCORING ENGINE)
// 점수는 규칙(수식)이 계산합니다. AI(또는 데모/폴백 모드의 결정론적 템플릿)는
// 그 결과를 설명할 뿐, 점수 자체를 결정하거나 바꾸지 않습니다.
// ─────────────────────────────────────────────────────────────────────────

export const SCORE_WEIGHTS = {
  fleetAge: 0.25,
  orderbookGap: 0.2,
  fleetSize: 0.15,
  fleetGrowth: 0.15,
  fuelTransition: 0.1,
  marketCondition: 0.15,
} as const;

export function calculateOpportunityScore(o: Opportunity): number {
  const f = o.factors;
  const raw =
    f.fleetAge * SCORE_WEIGHTS.fleetAge +
    f.orderbookGap * SCORE_WEIGHTS.orderbookGap +
    f.fleetSize * SCORE_WEIGHTS.fleetSize +
    f.fleetGrowth * SCORE_WEIGHTS.fleetGrowth +
    f.fuelTransition * SCORE_WEIGHTS.fuelTransition +
    f.marketCondition * SCORE_WEIGHTS.marketCondition;
  return Math.round(Math.min(100, Math.max(0, raw)));
}

export function classifyTier(score: number): OpportunityTier {
  if (score >= 85) return "VERY HIGH";
  if (score >= 70) return "HIGH";
  if (score >= 50) return "MEDIUM";
  return "LOW";
}

export const TIER_LABEL_KO: Record<OpportunityTier, string> = {
  LOW: "낮음",
  MEDIUM: "보통",
  HIGH: "높음",
  "VERY HIGH": "매우 높음",
};

function dominantFactorLabel(o: Opportunity): string {
  const f = o.factors;
  const entries: [string, number][] = [
    ["노후화된 선대", f.fleetAge],
    ["넓은 발주잔량 커버리지 격차", f.orderbookGap],
    ["선대 규모", f.fleetSize],
    ["선대 성장 추세", f.fleetGrowth],
    ["대체연료 전환 태세", f.fuelTransition],
    ["현재 시장 상황", f.marketCondition],
  ];
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}

// 결정론적 템플릿 — 데모/폴백 모드에서 LLM 설명을 대신합니다.
// 구조는 실제 AIProvider.generateCommercialInsight 호출이 반환할 형태를 그대로 모사합니다.
export function explainScore(o: Opportunity, score: number, tier: OpportunityTier): string {
  const dominant = dominantFactorLabel(o);
  return `${o.customer}은(는) ${score}/100점(${TIER_LABEL_KO[tier]})으로, 주로 ${dominant} 요인에 의해 견인되고 있습니다. 평균 선령 ${o.averageFleetAge.toFixed(
    1
  )}년에 발주잔량은 ${o.orderbook}척에 불과해, 선대 교체 시그널이 ${
    score >= 70 ? "뚜렷하게 나타나고" : "형성되는 단계에 있는 것으로"
  } 판단됩니다.`;
}

export function recommendedAction(tier: OpportunityTier, o: Opportunity): string {
  switch (tier) {
    case "VERY HIGH":
      return `신조 상담을 즉시 개시 — 이번 분기 내 ${o.segment} 제안과 기술 PT를 최우선 진행.`;
    case "HIGH":
      return `${o.segment} 세그먼트의 선대 교체 경제성을 소개하는 상업적 접점을 조속히 마련.`;
    case "MEDIUM":
      return `육성 파이프라인에 편입 — 향후 1~2분기 동안 발주잔량 및 연료전환 시그널을 모니터링.`;
    case "LOW":
      return `관계 유지 수준의 접촉만 진행 — 단기 신조 트리거는 감지되지 않음.`;
  }
}

export function scoreOpportunity(o: Opportunity): ScoredOpportunity {
  const score = calculateOpportunityScore(o);
  const tier = classifyTier(score);
  return {
    ...o,
    score,
    tier,
    recommendedAction: recommendedAction(tier, o),
  };
}

export function scoreAllOpportunities(list: Opportunity[]): ScoredOpportunity[] {
  return [...list].map(scoreOpportunity).sort((a, b) => b.score - a.score);
}

export const TIER_COLOR: Record<OpportunityTier, string> = {
  LOW: "text-score-low border-score-low/40 bg-score-low/10",
  MEDIUM: "text-score-medium border-score-medium/40 bg-score-medium/10",
  HIGH: "text-score-high border-score-high/40 bg-score-high/10",
  "VERY HIGH": "text-accent border-accent/40 bg-accent/10",
};
