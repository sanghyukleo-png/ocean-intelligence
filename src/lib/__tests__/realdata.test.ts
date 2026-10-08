import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import fxFixture from "./fixtures/frankfurter-fx.json";
import forecastFixture from "./fixtures/openmeteo-forecast.json";
import marineFixture from "./fixtures/openmeteo-marine.json";
import { CRACKS, readCrack, readMetric } from "@/lib/data/read";
import { runSource } from "@/lib/ingest/run";
import { parseMyVessels, vesselFromExtraction } from "@/lib/myVessels";
import { eiaWebSource } from "@/lib/sources/eia";
import { parseFrankfurter } from "@/lib/sources/frankfurter";
import { parseOpenMeteo, type MetPoint } from "@/lib/sources/openMeteo";
import { compass, summarizeMet } from "@/lib/weather/metSummary";
import { createMemoryStore } from "@/lib/store/memory";

const AT = "2026-10-08T03:00:00.000Z";

describe("수출국 환율 — ECB(Frankfurter) 실호출 응답", () => {
  it("USD 기준은 그대로, EUR·AUD는 관행 표기(역수)", () => {
    const obs = parseFrankfurter(fxFixture, AT);
    const last = (m: string) => obs.filter((o) => o.metric === m).at(-1)!;
    expect(last("usdkrw").value).toBe(1338.69);
    expect(last("usdjpy").unit).toBe("JPY/USD");
    expect(last("eurusd").value).toBeGreaterThan(1); // 1 / 0.88… ≈ 1.12
    expect(last("eurusd").unit).toBe("USD/EUR");
    expect(new Set(obs.map((o) => o.metric))).toEqual(new Set(["usdkrw", "usdjpy", "usdcny", "usdsgd", "eurusd", "audusd"]));
  });
});

describe("Open-Meteo 항만 예보 — 실호출 응답(울산·싱가포르 2지점)", () => {
  const targets = [
    { id: "ulsan", kind: "kr" as const, coord: [129.317, 35.533] as [number, number] },
    { id: "singapore", kind: "overseas" as const, coord: [103.85, 1.283] as [number, number] },
  ];
  it("지점 순서대로 바람·파고를 합친다 — 해상 격자 좌표를 보관", () => {
    const pts = parseOpenMeteo(forecastFixture, marineFixture, targets);
    expect(pts.map((p) => p.id)).toEqual(["ulsan", "singapore"]);
    expect(pts[0].times[0]).toMatch(/T00:00:00Z$/);
    expect(pts[0].windKt.length).toBe(pts[0].times.length);
    expect(pts[0].marineGrid).not.toBeNull();
  });
  it("지점 수가 다르면 형식 오류", () => {
    expect(() => parseOpenMeteo(forecastFixture, marineFixture, targets.slice(0, 1))).toThrowError(/지점 수/);
  });
});

describe("72시간 요약", () => {
  const point = (wind: (number | null)[], wave: (number | null)[], vis: (number | null)[] = []): MetPoint => ({
    id: "t",
    kind: "overseas",
    windGrid: [0, 0],
    marineGrid: [0, 0],
    times: wind.map((_, i) => new Date(Date.parse(AT) + i * 3600_000).toISOString()),
    windKt: wind,
    gustKt: wind,
    dirDeg: wind.map(() => 90),
    visM: vis.length ? vis : wind.map(() => 10000),
    waveM: wave,
    swellM: wave,
  });
  it("임계 초과 시간과 처음 시각 — 24시간 구간별", () => {
    const wind = Array.from({ length: 72 }, (_, i) => (i === 5 || i === 30 ? 30 : 10));
    const wave = Array.from({ length: 72 }, (_, i) => (i === 60 ? 2.5 : 0.5));
    const s = summarizeMet(point(wind, wave));
    expect(s.exceedHours).toEqual([1, 1, 1]);
    expect(s.firstExceed?.what).toEqual(["풍속"]);
    expect(s.maxWindKt).toBe(30);
    expect(s.maxWaveM).toBe(2.5);
  });
  it("값 없음(null)은 건너뛴다 · 저시정 1해리 미만", () => {
    const s = summarizeMet(point([null, 5], [null, null], [1000, 9000]));
    expect(s.maxWaveM).toBeNull();
    expect(s.exceedHours[0]).toBe(1);
    expect(s.firstExceed?.what).toEqual(["저시정"]);
  });
  it("16방위", () => {
    expect(compass(0)).toBe("N");
    expect(compass(225)).toBe("SW");
    expect(compass(359)).toBe("N");
    expect(compass(null)).toBe("—");
  });
});

describe("크랙 스프레드 — 같은 날짜의 제품×42 − Brent", () => {
  it("EIA 공개 표 수집값으로 계산", async () => {
    const store = createMemoryStore();
    const html = fs.readFileSync(path.join(__dirname, "fixtures/eia-spot-prices.htm"), "utf8");
    const fetch = (async () => new Response(html)) as unknown as typeof globalThis.fetch;
    await runSource(eiaWebSource, { store, env: {}, now: new Date(AT), fetch });
    const ulsd = await readMetric(store, "ulsd-usgc", {});
    expect(ulsd).toMatchObject({ grade: "live", value: 4.565 });
    const crack = await readCrack(store, CRACKS[0], {});
    // 10/06: 4.565 × 42 − 125.44 = 66.29
    expect(crack).toMatchObject({ grade: "live", value: 66.29 });
    expect(crack.provenance.asOf).toBe("2026-10-06");
    expect(crack.series).toHaveLength(6);
  });
  it("수집 전에는 값 없음", async () => {
    const crack = await readCrack(createMemoryStore(), CRACKS[0], {});
    expect(crack.value).toBeNull();
    expect(crack.grade).not.toBe("live");
  });
});

describe("내 선박 저장", () => {
  it("선명이 없으면 저장하지 않는다 · IMO가 있으면 IMO로 식별", () => {
    expect(vesselFromExtraction({ dwt: 1000 }, 0.5)).toBeNull();
    const v = vesselFromExtraction({ vesselName: " Test Vessel ", imo: "9439345", dwt: 13006, loa: 128.6 }, 0.8)!;
    expect(v).toMatchObject({ id: "imo-9439345", vesselName: "Test Vessel", vesselType: "선종 미확인", dwt: 13006, extractionConfidence: 0.8 });
  });
  it("저장값 검증 — 형식이 틀린 항목은 버린다", () => {
    expect(parseMyVessels([{ id: "a", vesselName: "A", dwt: "x", loa: 100 }, { id: 1 }, null])).toEqual([{ id: "a", vesselName: "A", vesselType: "선종 미확인", loa: 100 }]);
    expect(parseMyVessels("nope")).toEqual([]);
  });
});
