// ─────────────────────────────────────────────────────────────────────────
// DETERMINISTIC VOYAGE ECONOMICS / TCE CALCULATOR
// Pure TypeScript math — never delegated to an LLM.
// ─────────────────────────────────────────────────────────────────────────

export interface TceInputs {
  freightRate: number; // $/ton
  cargoQuantity: number; // tons
  distanceNm: number; // nautical miles
  speedKnots: number;
  bunkerPricePerTon: number; // $/ton fuel
  fuelConsumptionPerDay: number; // tons/day
  portCost: number; // $
  canalCost: number; // $
  commissionPct: number; // % of freight revenue
  waitingDays: number;
}

export interface TceResult {
  voyageRevenue: number;
  transitDays: number;
  totalVoyageDays: number;
  bunkerCost: number;
  commissionCost: number;
  totalVoyageCost: number;
  voyageProfit: number;
  tcePerDay: number;
}

export function calculateTce(inputs: TceInputs): TceResult {
  const {
    freightRate,
    cargoQuantity,
    distanceNm,
    speedKnots,
    bunkerPricePerTon,
    fuelConsumptionPerDay,
    portCost,
    canalCost,
    commissionPct,
    waitingDays,
  } = inputs;

  const voyageRevenue = freightRate * cargoQuantity;
  const transitDays = speedKnots > 0 ? distanceNm / (speedKnots * 24) : 0;
  const totalVoyageDays = transitDays + waitingDays;

  const bunkerCost = fuelConsumptionPerDay * transitDays * bunkerPricePerTon;
  const commissionCost = voyageRevenue * (commissionPct / 100);
  const totalVoyageCost = bunkerCost + portCost + canalCost + commissionCost;

  const voyageProfit = voyageRevenue - totalVoyageCost;
  const tcePerDay = totalVoyageDays > 0 ? voyageProfit / totalVoyageDays : 0;

  return {
    voyageRevenue,
    transitDays,
    totalVoyageDays,
    bunkerCost,
    commissionCost,
    totalVoyageCost,
    voyageProfit,
    tcePerDay,
  };
}

export const DEFAULT_TCE_INPUTS: TceInputs = {
  freightRate: 28,
  cargoQuantity: 50000,
  distanceNm: 4200,
  speedKnots: 13.5,
  bunkerPricePerTon: 620,
  fuelConsumptionPerDay: 32,
  portCost: 45000,
  canalCost: 0,
  commissionPct: 3.75,
  waitingDays: 2,
};
