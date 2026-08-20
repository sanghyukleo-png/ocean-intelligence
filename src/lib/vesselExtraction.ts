import { Vessel, VesselSource } from "@/types";

// ─────────────────────────────────────────────────────────────────────────
// 선박 제원 추출 엔진 (VESSEL SPEC EXTRACTION ENGINE)
// Q88 / 제원표 형태의 원문 텍스트를 정규식 기반 라벨-값 패턴 매칭으로 구조화합니다.
// 매칭에 실패한 필드는 절대 값을 추정/생성하지 않고 신뢰도 0으로 남깁니다
// (no-hallucination 원칙 — AI가 아니라 규칙이 값을 채웁니다).
// ─────────────────────────────────────────────────────────────────────────

export interface ExtractedField {
  key: string;
  label: string;
  value: string | number | null;
  confidence: number; // 0-1
  sourceText: string | null;
}

export interface VesselExtractionResult {
  vessel: Partial<Vessel>;
  fields: ExtractedField[];
  sources: VesselSource[];
  overallConfidence: number; // 0-1
  matchedCount: number;
  totalCount: number;
}

type FieldKind = "string" | "number";

interface FieldSpec {
  key: keyof Vessel;
  label: string;
  pattern: RegExp;
  kind: FieldKind;
}

const FIELD_SPECS: FieldSpec[] = [
  { key: "vesselName", label: "선명 (Vessel Name)", pattern: /Vessel Name:\s*(.+)/i, kind: "string" },
  { key: "imo", label: "IMO 번호", pattern: /IMO Number:\s*([\d]+)/i, kind: "string" },
  { key: "vesselType", label: "선종", pattern: /Vessel Type:\s*(.+)/i, kind: "string" },
  { key: "flag", label: "선적(Flag)", pattern: /Flag:\s*(.+)/i, kind: "string" },
  { key: "class", label: "선급", pattern: /Classification Society:\s*(.+)/i, kind: "string" },
  { key: "owner", label: "소유주(Owner)", pattern: /^Owner:\s*(.+)$/im, kind: "string" },
  { key: "operator", label: "운항사(Operator)", pattern: /Operator:\s*(.+)/i, kind: "string" },
  { key: "dwt", label: "재화중량톤(DWT)", pattern: /Deadweight \(DWT\):\s*([\d,]+)/i, kind: "number" },
  { key: "grossTonnage", label: "총톤수(GT)", pattern: /Gross Tonnage \(GT\):\s*([\d,]+)/i, kind: "number" },
  { key: "netTonnage", label: "순톤수(NT)", pattern: /Net Tonnage \(NT\):\s*([\d,]+)/i, kind: "number" },
  { key: "loa", label: "전장(LOA)", pattern: /Length Overall \(LOA\):\s*([\d.]+)/i, kind: "number" },
  { key: "beam", label: "형폭(Beam)", pattern: /Beam:\s*([\d.]+)/i, kind: "number" },
  { key: "draft", label: "흘수(Summer Draft)", pattern: /Summer Draft:\s*([\d.]+)/i, kind: "number" },
  { key: "builtYear", label: "건조연도", pattern: /Built:\s*(\d{4})/i, kind: "number" },
  { key: "speed", label: "서비스 속력", pattern: /Service Speed:\s*([\d.]+)/i, kind: "number" },
  { key: "fuelConsumption", label: "연료소모량", pattern: /Fuel Consumption[^:]*:\s*([\d.]+)/i, kind: "number" },
  { key: "fuelType", label: "연료 종류", pattern: /Fuel Type:\s*(.+)/i, kind: "string" },
  { key: "cargoCapacity", label: "화물창 용량", pattern: /Cargo Capacity:\s*([\d,]+)/i, kind: "number" },
];

function toNumber(raw: string): number {
  return Number(raw.replace(/,/g, "").trim());
}

export function extractVesselFromText(text: string): VesselExtractionResult {
  const fields: ExtractedField[] = [];
  const sources: VesselSource[] = [];
  const vessel: Partial<Vessel> = {};
  let matchedCount = 0;

  for (const spec of FIELD_SPECS) {
    const match = text.match(spec.pattern);
    const rawValue = match?.[1]?.trim();

    if (rawValue) {
      const value: string | number = spec.kind === "number" ? toNumber(rawValue) : rawValue;
      const isValidNumber = spec.kind !== "number" || !Number.isNaN(value as number);
      const confidence = isValidNumber ? 0.95 : 0.15;

      fields.push({ key: spec.key as string, label: spec.label, value, confidence, sourceText: match![0].trim() });

      if (isValidNumber) {
        matchedCount += 1;
        sources.push({ page: 1, field: spec.label, text: match![0].trim() });
        (vessel as Record<string, unknown>)[spec.key as string] = value;
      }
    } else {
      fields.push({ key: spec.key as string, label: spec.label, value: null, confidence: 0, sourceText: null });
    }
  }

  const overallConfidence = Math.round((matchedCount / FIELD_SPECS.length) * 100) / 100;
  vessel.extractionConfidence = overallConfidence;
  vessel.sources = sources;

  return {
    vessel,
    fields,
    sources,
    overallConfidence,
    matchedCount,
    totalCount: FIELD_SPECS.length,
  };
}
