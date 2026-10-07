import { describe, expect, it } from "vitest";
import { extractVesselFromText } from "@/lib/vesselExtraction";
import { sampleVesselSpecText } from "@/data/mockVessels";

function field(text: string, key: string) {
  const result = extractVesselFromText(text);
  const f = result.fields.find((x) => x.key === key);
  if (!f) throw new Error(`field ${key} missing`);
  return { result, f };
}

describe("extractVesselFromText", () => {
  it("샘플 제원 텍스트에서 18개 필드를 모두 읽는다", () => {
    const result = extractVesselFromText(sampleVesselSpecText);
    expect(result.totalCount).toBe(18);
    expect(result.matchedCount).toBe(18);
    expect(result.vessel.dwt).toBe(50000);
    expect(result.vessel.cargoCapacity).toBe(56000);
    expect(result.vessel.loa).toBe(183);
  });

  // 회귀: [\d,]+ 패턴이 쉼표만 잡으면 Number("") === 0 이 되어 '0'이 신뢰도 95%로 채워졌다
  it.each([
    ["Deadweight (DWT): ,", "dwt"],
    ["Deadweight (DWT): , MT", "dwt"],
    ["Gross Tonnage (GT): ,,,", "grossTonnage"],
    ["Cargo Capacity: , CBM", "cargoCapacity"],
  ])("숫자 없는 값 %j 을 0으로 만들지 않는다", (text, key) => {
    const { result, f } = field(text, key);
    expect(f.value).not.toBe(0);
    expect(Number.isNaN(f.value)).toBe(true);
    expect(f.confidence).toBe(0.15);
    // 라벨은 찾았다 — 원문 줄을 남겨 '읽기 실패'로 보여 준다
    expect(text.startsWith(f.sourceText ?? "\u0000")).toBe(true);
    expect(result.matchedCount).toBe(0);
    expect((result.vessel as Record<string, unknown>)[key]).toBeUndefined();
  });

  it("점 하나뿐인 소수 값도 읽기 실패로 둔다", () => {
    const { f } = field("Beam: .", "beam");
    expect(f.confidence).toBe(0.15);
  });

  it("쉼표 천 단위 구분은 그대로 읽는다", () => {
    const { f } = field("Deadweight (DWT): 13,006 MT", "dwt");
    expect(f.value).toBe(13006);
    expect(f.confidence).toBe(0.95);
  });

  it("라벨이 없으면 값을 만들지 않는다", () => {
    const { result, f } = field("Vessel Name: TEST", "dwt");
    expect(f.value).toBeNull();
    expect(f.confidence).toBe(0);
    expect(result.vessel.dwt).toBeUndefined();
  });
});
