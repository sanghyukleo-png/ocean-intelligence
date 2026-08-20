// ── Vessel ──────────────────────────────────────────────────────────
export interface VesselSource {
  page: number;
  field: string;
  text: string;
}

export interface Vessel {
  id: string;
  vesselName: string;
  imo?: string;
  vesselType: string;

  dwt?: number;
  draft?: number;
  loa?: number;
  beam?: number;

  grossTonnage?: number;
  netTonnage?: number;

  builtYear?: number;
  speed?: number;
  fuelConsumption?: number;

  fuelType?: string;
  cargoCapacity?: number;

  owner?: string;
  operator?: string;
  class?: string;
  flag?: string;

  extractionConfidence?: number;
  sources?: VesselSource[];
}

// ── Market ──────────────────────────────────────────────────────────
export type TrendDirection = "up" | "down" | "flat";

export interface MarketIndicator {
  id: string;
  label: string;
  value: number;
  unit: string;
  changePct: number;
  direction: TrendDirection;
  sparkline: number[];
  description?: string;
}

export type SignalImportance = "low" | "medium" | "high";

export interface MarketSignal {
  id: string;
  title: string;
  direction: TrendDirection;
  importance: SignalImportance;
  segment: string;
  summary: string;
}

// ── Opportunities ───────────────────────────────────────────────────
export type OpportunityTier = "LOW" | "MEDIUM" | "HIGH" | "VERY HIGH";

export interface ScoreFactors {
  fleetAge: number; // 0-100 normalized
  orderbookGap: number;
  fleetSize: number;
  fleetGrowth: number;
  fuelTransition: number;
  marketCondition: number;
}

export interface Opportunity {
  id: string;
  customer: string;
  country: string;
  fleetSize: number;
  averageFleetAge: number;
  orderbook: number;
  fleetGrowthPct: number;
  fuelTransitionPct: number;
  marketConditionScore: number; // 0-100 raw input
  segment: string;
  signals: string[];
  factors: ScoreFactors;
}

export interface ScoredOpportunity extends Opportunity {
  score: number;
  tier: OpportunityTier;
  recommendedAction: string;
}

// ── Sales Brief ─────────────────────────────────────────────────────
export interface SalesBrief {
  customer: string;
  generatedAt: string;
  executiveSummary: string;
  keyFindings: string[];
  commercialAssessment: string;
  customerOpportunity: string;
  talkingPoints: string[];
  recommendedNextAction: string;
}
