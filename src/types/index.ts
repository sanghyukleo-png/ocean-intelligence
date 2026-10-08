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
