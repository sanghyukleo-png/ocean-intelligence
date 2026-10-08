import { describe, expect, it } from "vitest";
import { AIS_GATES } from "@/data/geo/aisAreas";
import { aggregateGates, directionOf, lengthBucket, mergeStatics, type AisStatic } from "@/lib/ais/aggregate";
import { readAisMessage } from "@/lib/sources/aisstream";

const KS = AIS_GATES.find((g) => g.id === "korea-strait")!;
const HZ = AIS_GATES.find((g) => g.id === "hormuz")!;
const AT = "2026-10-08T00:00:00.000Z";
const tanker = (lengthM: number): AisStatic => ({ type: 80, lengthM, name: "T", imo: 0, at: AT });

describe("AIS 집계", () => {
  it("방향 구간 — 360 넘김", () => {
    expect(directionOf(10, KS)).toBe("ne");
    expect(directionOf(330, KS)).toBe("ne");
    expect(directionOf(200, KS)).toBe("sw");
    expect(directionOf(360, KS)).toBeNull(); // AIS 360 = 사용 불가
    expect(directionOf(290, HZ)).toBe("in");
  });

  it("길이 구간", () => {
    expect(lengthBucket(0)).toBeNull();
    expect(lengthBucket(183)).toBe("130-200");
    expect(lengthBucket(333)).toBe("gte300");
  });

  it("상자 안 탱커만, MMSI별 마지막 위치, 저속은 따로, 선종 미확인 집계", () => {
    const positions = [
      { mmsi: 1, lat: 34.6, lon: 129.2, sog: 12, cog: 40, at: "2026-10-08T00:00:01Z" },
      { mmsi: 1, lat: 34.7, lon: 129.3, sog: 12, cog: 220, at: "2026-10-08T00:00:20Z" }, // 같은 배 — 마지막 위치만
      { mmsi: 2, lat: 34.5, lon: 129.0, sog: 0.2, cog: 0, at: AT }, // 정박
      { mmsi: 3, lat: 34.5, lon: 129.0, sog: 10, cog: 10, at: AT }, // 화물선
      { mmsi: 4, lat: 34.5, lon: 129.0, sog: 10, cog: 10, at: AT }, // 선종 미상
      { mmsi: 5, lat: 10, lon: 10, sog: 10, cog: 10, at: AT }, // 상자 밖
    ];
    const statics = { "1": tanker(183), "2": tanker(250), "3": { ...tanker(200), type: 70 }, "5": tanker(100) };
    const ks = aggregateGates(positions, statics, AIS_GATES).find((g) => g.gateId === "korea-strait")!;
    expect(ks.underway).toEqual({ ne: 0, sw: 1 });
    expect(ks.slow).toBe(1);
    expect(ks.unknownType).toBe(1);
    expect(ks.total).toBe(4);
    expect(ks.byLength).toEqual({ "130-200": 1, "250-300": 1 });
  });

  it("정적 정보 캐시는 30일 지나면 버린다", () => {
    const now = new Date(AT);
    const old = { ...tanker(100), at: "2026-08-01T00:00:00Z" };
    expect(Object.keys(mergeStatics({ "9": old }, { "1": tanker(100) }, now))).toEqual(["1"]);
  });

  it("aisstream 메시지 모델 읽기", () => {
    const pos = readAisMessage({ MessageType: "PositionReport", MetaData: {}, Message: { PositionReport: { UserID: 440123000, Latitude: 34.6, Longitude: 129.2, Sog: 11.5, Cog: 45 } } }, AT);
    expect(pos.position).toEqual({ mmsi: 440123000, lat: 34.6, lon: 129.2, sog: 11.5, cog: 45, at: AT });
    const st = readAisMessage({ MessageType: "ShipStaticData", MetaData: {}, Message: { ShipStaticData: { UserID: 440123000, Type: 84, Dimension: { A: 150, B: 33, C: 16, D: 16 }, Name: "TEST ", ImoNumber: 9439345 } } }, AT);
    expect(st.static).toEqual(["440123000", { type: 84, lengthM: 183, name: "TEST", imo: 9439345, at: AT }]);
    expect(readAisMessage({ MessageType: "PositionReport", Message: { PositionReport: { UserID: 1, Latitude: 91, Longitude: 181 } } }, AT)).toEqual({});
  });
});
