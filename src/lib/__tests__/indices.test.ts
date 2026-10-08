import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import imfFixture from "./fixtures/imf-pcps-poildub.json";
import sseFixture from "./fixtures/sse-scfi.json";
import { readMetric } from "@/lib/data/read";
import { runSource, validateSeries } from "@/lib/ingest/run";
import { parseBunkerInput } from "@/lib/bunker-input";
import { KMA_PORTS } from "@/data/kmaPortZones";
import { kobcKcciSource, parseKobcKcci, parseSseScfi } from "@/lib/sources/freightIndices";
import { imfDubaiSource, parseImfPcps } from "@/lib/sources/imf";
import type { Observation } from "@/lib/sources/types";
import { createMemoryStore } from "@/lib/store/memory";

const AT = "2026-10-08T03:00:00.000Z";
const kobcHtml = fs.readFileSync(path.join(__dirname, "fixtures/kobc-kcci.html"), "utf8");

describe("Dubai 월평균 — IMF PCPS (실호출 응답)", () => {
  it("월 값·월 정밀도", () => {
    const obs = parseImfPcps(imfFixture, AT);
    expect(obs.map((o) => o.asOf)).toEqual(["2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09"]);
    expect(obs.at(-1)).toMatchObject({ metric: "dubai", value: 111.83, asOfPrecision: "month", unit: "USD/bbl" });
  });

  it("2월→3월 +85% 같은 실제 급변도 다음 달이 확인하면 이력에 남는다", async () => {
    const store = createMemoryStore();
    const fetch = (async () => new Response(JSON.stringify(imfFixture))) as unknown as typeof globalThis.fetch;
    const r = await runSource(imfDubaiSource, { store, env: {}, now: new Date(AT), fetch });
    expect(r.status).toBe("ok");
    const m = await readMetric(store, "dubai", {});
    expect(m.grade).toBe("live");
    expect(m.series.map((o) => o.asOf)).toContain("2026-03");
    expect(m.provenance).toMatchObject({ asOf: "2026-09", asOfPrecision: "month", source: "IMF PCPS" });
  });
});

describe("SCFI 종합지수 — 상하이해운거래소 (실호출 응답)", () => {
  it("직전·현재 두 값", () => {
    expect(parseSseScfi(sseFixture, AT).map((o) => [o.asOf, o.value])).toEqual([
      ["2026-09-24", 3686.62],
      ["2026-09-30", 3662.3],
    ]);
  });
  it("종합지수 행이 없으면 형식 오류, status≠1이면 원천 오류", () => {
    expect(() => parseSseScfi({ status: 1, data: { lineDataList: [] } }, AT)).toThrowError(/SCFI_T/);
    expect(() => parseSseScfi({ status: 0, data: {} }, AT)).toThrowError(/status/);
  });
});

describe("KCCI — 한국해양진흥공사 (실호출 HTML 발췌)", () => {
  it("기준일·종합지수", () => {
    expect(parseKobcKcci(kobcHtml, AT).map((o) => [o.asOf, o.value])).toEqual([
      ["2026-09-28", 4678],
      ["2026-10-06", 4629],
    ]);
  });
  it("표 구조가 바뀌면 조용히 넘기지 않는다", () => {
    expect(() => parseKobcKcci("<table><tr><td>점검 중</td></tr></table>", AT)).toThrowError(/기준일/);
  });
  it("수집 → LIVE", async () => {
    const store = createMemoryStore();
    const fetch = (async () => new Response(kobcHtml)) as unknown as typeof globalThis.fetch;
    await runSource(kobcKcciSource, { store, env: {}, now: new Date(AT), fetch });
    const m = await readMetric(store, "kcci", {});
    expect(m).toMatchObject({ grade: "live", value: 4629 });
    expect(m.changePct).toBeCloseTo(((4629 - 4678) / 4678) * 100, 6);
  });
});

const o = (value: number, asOf: string): Observation => ({ metric: "x", value, unit: "u", asOf, asOfPrecision: "day", fetchedAt: AT, source: "s", sourceUrl: "" });

describe("급변 검증 — 수준 변화 확인", () => {
  it("한 번 튄 값만 거른다", () => {
    const r = validateSeries(null, [o(100, "1"), o(200, "2"), o(101, "3")]);
    expect(r.accepted.map((x) => x.value)).toEqual([100, 101]);
    expect(r.rejected).toHaveLength(1);
    expect(r.latestRejected).toBe(false);
  });
  it("다음 값이 같은 수준이면 둘 다 받는다", () => {
    const r = validateSeries(o(100, "0"), [o(200, "1"), o(205, "2")]);
    expect(r.accepted.map((x) => x.value)).toEqual([200, 205]);
    expect(r.rejected).toEqual([]);
  });
  it("최신 값이 급변으로 끝나면 latestRejected — 실행은 실패로 기록된다", () => {
    const r = validateSeries(o(100, "0"), [o(101, "1"), o(300, "2")]);
    expect(r.accepted.map((x) => x.value)).toEqual([101]);
    expect(r.latestRejected).toBe(true);
  });
});

describe("벙커가 직접 입력", () => {
  it("저장값 검증 — 잘못된 항목은 버린다", () => {
    expect(parseBunkerInput({ prices: { "vlsfo-sg": 612.5, "mgo-sg": -1, "vlsfo-busan": "abc", other: 1 }, asOf: "2026-10-08", note: "견적" })).toEqual({
      prices: { "vlsfo-sg": 612.5 },
      asOf: "2026-10-08",
      note: "견적",
      savedAt: null,
    });
    expect(parseBunkerInput(null).prices).toEqual({});
    expect(parseBunkerInput({ asOf: "10/08" }).asOf).toBeNull();
  });
});

describe("단기 해상예보 구역 코드", () => {
  it("모든 항만에 해상국지 앞바다 코드(8자리)", () => {
    for (const p of KMA_PORTS) {
      expect(p.shortSeaRegIds.length, p.name).toBeGreaterThan(0);
      for (const c of p.shortSeaRegIds) expect(c, p.name).toMatch(/^(12|22)[A-C]\d{5}$/);
    }
  });
});
