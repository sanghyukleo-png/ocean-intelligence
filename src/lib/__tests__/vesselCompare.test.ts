import { describe, expect, it } from "vitest";
import { buildCompareRows, cargoCapacityUnit, generateComparisonInsight } from "@/lib/vesselCompare";
import { mockVessels } from "./fixtures/vessels";

const byId = (id: string) => {
  const v = mockVessels.find((x) => x.id === id);
  if (!v) throw new Error(id);
  return v;
};

describe("buildCompareRows — 화물창 용량 단위", () => {
  it("컨테이너선은 TEU, 그 외는 CBM", () => {
    expect(cargoCapacityUnit(byId("v-02"))).toBe("TEU");
    expect(cargoCapacityUnit(byId("v-01"))).toBe("CBM");
  });

  it("같은 단위끼리는 행 단위 CBM과 최고 표시를 낸다", () => {
    const row = buildCompareRows([byId("v-01"), byId("v-05")]).find((r) => r.key === "cargoCapacity")!;
    expect(row.unit).toBe("CBM");
    expect(row.cellUnits).toBeUndefined();
    expect(row.bestIndex).toBe(1); // 57,200 > 56,000
  });

  it("CBM과 TEU가 섞이면 행 단위를 비우고 칸별 단위를 주며 최고 표시를 하지 않는다", () => {
    const row = buildCompareRows([byId("v-01"), byId("v-02")]).find((r) => r.key === "cargoCapacity")!;
    expect(row.unit).toBe("");
    expect(row.cellUnits).toEqual(["CBM", "TEU"]);
    expect(row.bestIndex).toBeNull();
  });

  it("다른 행은 단위가 바뀌지 않는다", () => {
    const rows = buildCompareRows([byId("v-01"), byId("v-02")]);
    expect(rows.find((r) => r.key === "dwt")!.unit).toBe("MT");
    expect(rows.find((r) => r.key === "fuelConsumption")!.unit).toBe("MT/day");
  });
});

describe("generateComparisonInsight", () => {
  it("DWT를 실행 환경 로캘과 무관하게 en-US 구분자로 쓴다(하이드레이션 일치)", () => {
    const text = generateComparisonInsight([byId("v-01"), byId("v-03")]).join("\n");
    expect(text).toMatch(/DWT \d{1,3}(,\d{3})+MT/);
  });
});
