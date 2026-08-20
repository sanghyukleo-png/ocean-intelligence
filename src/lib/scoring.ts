import { Opportunity, OpportunityTier, ScoredOpportunity } from "@/types";

// ─────────────────────────────────────────────────────────────────────────
// DETERMINISTIC OPPORTUNITY SCORING ENGINE
// Rules calculate the score. AI (or, in demo/fallback mode, a deterministic
// template) only explains the result — it never determines or alters it.
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

function dominantFactorLabel(o: Opportunity): string {
  const f = o.factors;
  const entries: [string, number][] = [
    ["aging fleet profile", f.fleetAge],
    ["a wide orderbook coverage gap", f.orderbookGap],
    ["fleet scale", f.fleetSize],
    ["fleet growth trajectory", f.fleetGrowth],
    ["alternative-fuel transition posture", f.fuelTransition],
    ["current market conditions", f.marketCondition],
  ];
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}

// Deterministic template — stands in for an LLM explanation in demo/fallback
// mode. Structure mirrors what an AIProvider.generateCommercialInsight call
// would return.
export function explainScore(o: Opportunity, score: number, tier: OpportunityTier): string {
  const dominant = dominantFactorLabel(o);
  return `${o.customer} scores ${score}/100 (${tier}), primarily driven by ${dominant}. With an average fleet age of ${o.averageFleetAge.toFixed(1)} years against an orderbook of only ${o.orderbook} vessel${o.orderbook === 1 ? "" : "s"}, the fleet-renewal signal is ${score >= 70 ? "material" : "developing"}.`;
}

export function recommendedAction(tier: OpportunityTier, o: Opportunity): string {
  switch (tier) {
    case "VERY HIGH":
      return `Initiate newbuilding discussion — prioritize ${o.segment} proposal with technical PT within this quarter.`;
    case "HIGH":
      return `Schedule a commercial touchpoint to introduce fleet-renewal economics for ${o.segment}.`;
    case "MEDIUM":
      return `Add to nurture pipeline — monitor orderbook and fuel-transition signals for the next 1-2 quarters.`;
    case "LOW":
      return `Maintain relationship visibility only — no near-term newbuilding trigger detected.`;
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
