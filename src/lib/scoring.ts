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

// 요인이 점수를 끌어올리는 방향으로 작용할 때 쓰는 라벨(값이 높을수록 해당됨)
const DRIVING_LABELS: Record<keyof ScoreFactorsKeys, string> = {
  fleetAge: "노후화된 선대",
  orderbookGap: "넓은 발주잔량 커버리지 격차",
  fleetSize: "큰 선대 규모",
  fleetGrowth: "빠른 선대 성장 추세",
  fuelTransition: "활발한 대체연료 전환 태세",
  marketCondition: "우호적인 시장 상황",
};

// 요인이 점수 상승을 제한하는 방향으로 작용할 때 쓰는 라벨(값이 낮을수록 해당됨)
const LIMITING_LABELS: Record<keyof ScoreFactorsKeys, string> = {
  fleetAge: "비교적 젊은 선대 구성",
  orderbookGap: "이미 확보된 발주잔량 커버리지",
  fleetSize: "제한적인 선대 규모",
  fleetGrowth: "정체된 선대 성장세",
  fuelTransition: "초기 단계에 머문 대체연료 전환",
  marketCondition: "우호적이지 않은 시장 상황",
};

type ScoreFactorsKeys = Opportunity["factors"];

// 요인은 가중치가 서로 다르므로, 원값이 아니라 "가중치 × 값" 기준으로 비교해야
// 실제로 점수에 가장 크게 기여(또는 제약)한 요인을 올바르게 찾을 수 있습니다.
function dominantFactorLabel(o: Opportunity, tier: OpportunityTier): string {
  const f = o.factors;
  const weighted: [keyof ScoreFactorsKeys, number][] = [
    ["fleetAge", f.fleetAge * SCORE_WEIGHTS.fleetAge],
    ["orderbookGap", f.orderbookGap * SCORE_WEIGHTS.orderbookGap],
    ["fleetSize", f.fleetSize * SCORE_WEIGHTS.fleetSize],
    ["fleetGrowth", f.fleetGrowth * SCORE_WEIGHTS.fleetGrowth],
    ["fuelTransition", f.fuelTransition * SCORE_WEIGHTS.fuelTransition],
    ["marketCondition", f.marketCondition * SCORE_WEIGHTS.marketCondition],
  ];

  const rising = tier === "HIGH" || tier === "VERY HIGH";
  weighted.sort((a, b) => (rising ? b[1] - a[1] : a[1] - b[1]));
  const key = weighted[0][0];
  return rising ? DRIVING_LABELS[key] : LIMITING_LABELS[key];
}

// 결정론적 템플릿 — 데모/폴백 모드에서 LLM 설명을 대신합니다.
// 구조는 실제 AIProvider.generateCommercialInsight 호출이 반환할 형태를 그대로 모사합니다.
export function explainScore(o: Opportunity, score: number, tier: OpportunityTier): string {
  const dominant = dominantFactorLabel(o, tier);
  const rising = tier === "HIGH" || tier === "VERY HIGH";

  if (rising) {
    return `${o.customer}은(는) ${score}/100점(${TIER_LABEL_KO[tier]})으로, 주로 ${dominant} 요인에 의해 견인되고 있습니다. 평균 선령 ${o.averageFleetAge.toFixed(
      1
    )}년에 발주잔량은 ${o.orderbook}척에 불과해, 선대 교체 시그널이 뚜렷하게 나타나고 있는 것으로 판단됩니다.`;
  }

  return `${o.customer}은(는) ${score}/100점(${TIER_LABEL_KO[tier]})으로, ${dominant} 특성이 점수 상승을 제한하고 있습니다. 평균 선령 ${o.averageFleetAge.toFixed(
    1
  )}년, 발주잔량 ${o.orderbook}척 기준으로 볼 때 선대 교체 시그널은 아직 형성되는 단계로 판단됩니다.`;
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

// 표시 전용. HIGH 글자는 틴트 위 4.5:1을 넘기도록 accent-text를 쓴다.
// HIGH(accent)와 VERY HIGH(up)는 색상이 거의 같아 보이므로 최상위 등급은 채움으로 구분한다.
export const TIER_COLOR: Record<OpportunityTier, string> = {
  LOW: "text-score-low border-score-low/40 bg-score-low/10",
  MEDIUM: "text-score-medium border-score-medium/40 bg-score-medium/10",
  HIGH: "text-accent-text border-score-high/40 bg-score-high/10",
  "VERY HIGH": "text-accent-ink border-score-vhigh bg-score-vhigh",
};
