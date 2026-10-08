import { describe, expect, it } from "vitest";
import ecosFixture from "./fixtures/ecos-731Y001.json";
import frankfurterFixture from "./fixtures/frankfurter-usdkrw.json";
import { readMetric } from "@/lib/data/read";
import { healthOf, overallOf } from "@/lib/ingest/health";
import { nextDueAt, runSource, validateObservation } from "@/lib/ingest/run";
import { parseEcos } from "@/lib/sources/ecos";
import { parseEia } from "@/lib/sources/eia";
import { frankfurterSource, parseFrankfurter } from "@/lib/sources/frankfurter";
import { parseKoreaExim } from "@/lib/sources/koreaexim";
import { toNumber } from "@/lib/sources/http";
import type { Observation } from "@/lib/sources/types";
import { createMemoryStore } from "@/lib/store/memory";

const AT = "2026-10-08T00:00:00.000Z";

describe("소스 어댑터 파서", () => {
  it("Frankfurter(ECB) — 실호출 응답", () => {
    const obs = parseFrankfurter(frankfurterFixture, AT);
    expect(obs).toHaveLength(6);
    expect(obs.at(-1)).toMatchObject({ metric: "usdkrw", value: 1338.69, asOf: "2026-10-07", asOfPrecision: "day" });
  });

  it("ECOS 731Y001 — sample 키 실호출 응답", () => {
    const obs = parseEcos(ecosFixture, AT);
    expect(obs[0]).toMatchObject({ asOf: "2026-09-28", value: 1352 });
    expect(obs.every((o) => o.unit === "KRW/USD")).toBe(true);
  });

  it("ECOS 오류 코드", () => {
    expect(() => parseEcos({ RESULT: { CODE: "INFO-100", MESSAGE: "x" } }, AT)).toThrowError(/인증키/);
    expect(() => parseEcos({ RESULT: { CODE: "INFO-200", MESSAGE: "x" } }, AT)).toThrowError(/데이터 없음/);
  });

  it("수출입은행 AP01 — 명세 예시 응답", () => {
    const sample = [
      { result: 1, cur_unit: "AED", deal_bas_r: "291.7" },
      { result: 1, cur_unit: "USD", ttb: "1,056.23", tts: "1,077.56", deal_bas_r: "1,066.9" },
    ];
    expect(parseKoreaExim(sample)).toBe(1066.9);
    expect(parseKoreaExim([])).toBeNull(); // 비영업일·11시 이전
    expect(() => parseKoreaExim([{ result: 3, cur_unit: null, deal_bas_r: null }])).toThrowError(/인증키/);
    expect(() => parseKoreaExim([{ result: 4 }])).toThrowError(/1,000회/);
  });

  it("EIA v2 — 문자열 값, 시리즈 매핑, value 열 누락은 형식 오류", () => {
    const json = {
      response: {
        data: [
          { period: "2026-09-29", series: "RBRTE", value: "68.12", units: "$/BBL" },
          { period: "2026-09-29", series: "RWTC", value: "64.50", units: "$/BBL" },
          { period: "2026-09-29", series: "EER_EPMRU_PF4_RGC_DPG", value: "2.1" },
        ],
      },
    };
    const obs = parseEia(json, AT);
    expect(obs.map((o) => [o.metric, o.value])).toEqual([
      ["brent", 68.12],
      ["wti", 64.5],
    ]);
    expect(() => parseEia({ response: { data: [{ period: "2026-09-29", series: "RBRTE" }] } }, AT)).toThrowError(/value/);
  });

  it("숫자 정규화", () => {
    expect(toNumber("1,343.5")).toBe(1343.5);
    expect(toNumber("")).toBeNull();
    expect(toNumber("N/A")).toBeNull();
  });
});

const obs = (value: number, asOf: string): Observation => ({ metric: "usdkrw", value, unit: "KRW/USD", asOf, asOfPrecision: "day", fetchedAt: AT, source: "frankfurter-ecb", sourceUrl: "x" });

describe("값 검증 (11.2)", () => {
  it("직전 대비 ±30% 이상은 저장하지 않는다", () => {
    expect(validateObservation(obs(1300, "2026-10-06"), obs(1330, "2026-10-07"))).toBeNull();
    expect(validateObservation(obs(1300, "2026-10-06"), obs(1690, "2026-10-07"))).toMatch(/30%/);
    expect(validateObservation(obs(1300, "2026-10-06"), obs(900, "2026-10-07"))).toMatch(/30%/);
    expect(validateObservation(null, obs(0, "2026-10-07"))).toMatch(/0 이하/);
  });
});

function fakeFetch(body: unknown, status = 200): typeof fetch {
  return (async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;
}

describe("수집 실행기 · 실패 시 마지막 성공값 (11.7)", () => {
  it("성공 → LIVE, 이후 실패 → 마지막 성공값 + 수집 실패 + 사유", async () => {
    const store = createMemoryStore();
    const env = {};
    const ok = await runSource(frankfurterSource, { store, env, now: new Date(AT), fetch: fakeFetch(frankfurterFixture) });
    expect(ok.status).toBe("ok");
    let r = await readMetric(store, "usdkrw", env);
    expect(r.grade).toBe("live");
    expect(r.value).toBe(1338.69);
    expect(r.provenance.source).toBe("ECB 기준환율");
    expect(r.changePct).toBeCloseTo(((1338.69 - 1338.78) / 1338.78) * 100, 6);

    // 최소 간격 안에서는 건너뛴다
    const skipped = await runSource(frankfurterSource, { store, env, now: new Date(AT), fetch: fakeFetch(frankfurterFixture) });
    expect(skipped.status).toBe("skipped");

    // 강제 실패(INGEST_SIMULATE_FAILURE)
    const failed = await runSource(frankfurterSource, { store, env: { INGEST_SIMULATE_FAILURE: "frankfurter-ecb" }, now: new Date(AT), force: true });
    expect(failed.status).toBe("failed");
    r = await readMetric(store, "usdkrw", env);
    expect(r.grade).toBe("stale");
    expect(r.value).toBe(1338.69); // 가짜 값이 아니라 마지막 성공값
    expect(r.provenance.error).toMatch(/강제 실패/);
    expect(r.provenance.fetchedAt).toBe(AT);

    // 다시 성공하면 LIVE로 복귀
    await runSource(frankfurterSource, { store, env, now: new Date(AT), fetch: fakeFetch(frankfurterFixture), force: true });
    expect((await readMetric(store, "usdkrw", env)).grade).toBe("live");
  });

  it("HTTP 오류·빈 응답·급변 값은 실패로 기록하고 이전 값을 지키지 않는 일이 없다", async () => {
    const store = createMemoryStore();
    const http = await runSource(frankfurterSource, { store, env: {}, now: new Date(AT), fetch: fakeFetch({}, 500) });
    expect(http).toMatchObject({ status: "failed", kind: "http" });
    const empty = await runSource(frankfurterSource, { store, env: {}, now: new Date(AT), fetch: fakeFetch([]), force: true });
    expect(empty).toMatchObject({ status: "failed", kind: "empty" });
    // 값 없음 + 실패 → stale(값 없음) — "정상"이나 0으로 보이지 않는다
    const r = await readMetric(store, "usdkrw", {});
    expect(r).toMatchObject({ grade: "stale", value: null });

    await runSource(frankfurterSource, { store, env: {}, now: new Date(AT), fetch: fakeFetch(frankfurterFixture), force: true });
    const jump = await runSource(frankfurterSource, {
      store,
      env: {},
      now: new Date(AT),
      force: true,
      fetch: fakeFetch([{ date: "2026-10-08", base: "USD", quote: "KRW", rate: 2000 }]),
    });
    expect(jump).toMatchObject({ status: "failed", kind: "invalid" });
    expect((await readMetric(store, "usdkrw", {})).value).toBe(1338.69);
  });

  it("키가 없으면 수집하지 않고 nokey — 우선순위 소스 중 키 있는 것을 쓴다", async () => {
    const store = createMemoryStore();
    const { koreaEximSource } = await import("@/lib/sources/koreaexim");
    const r = await runSource(koreaEximSource, { store, env: {} });
    expect(r).toEqual({ sourceId: "koreaexim", status: "nokey", missing: ["KOREAEXIM_API_KEY"] });
    expect((await readMetric(store, "brent", {})).grade).toBe("nokey");
    expect((await readMetric(store, "usdkrw", {})).grade).toBe("pending"); // 키 불필요 소스가 첫 수집 대기
    expect((await readMetric(store, "dubai", {})).grade).toBe("pending"); // 소스 미확보
  });

  it("실패 후에는 재시도 간격, 성공 후에는 최소 간격", () => {
    const now = new Date(AT);
    const base = { sourceId: "x", lastSuccessAt: null, lastDurationMs: null, lastError: null };
    const after1m = new Date(now.getTime() - 60_000).toISOString();
    expect(nextDueAt(frankfurterSource, { ...base, lastAttemptAt: after1m, consecutiveFailures: 0 }, now)).not.toBeNull();
    expect(nextDueAt(frankfurterSource, { ...base, lastAttemptAt: new Date(now.getTime() - 16 * 60_000).toISOString(), consecutiveFailures: 1 }, now)).toBeNull();
  });
});

describe("상태 점", () => {
  it("수집 중인 소스 중 가장 나쁜 상태", () => {
    expect(overallOf(["nokey", "blocked"])).toBe("unconfigured");
    expect(overallOf(["ok", "nokey"])).toBe("ok");
    expect(overallOf(["ok", "delayed"])).toBe("delayed");
    expect(overallOf(["ok", "failed", "delayed"])).toBe("failed");
  });

  it("마지막 성공이 오래되면 지연", () => {
    const now = new Date(AT);
    const status = { sourceId: "frankfurter-ecb", lastAttemptAt: AT, lastSuccessAt: new Date(now.getTime() - 5 * 86400_000).toISOString(), consecutiveFailures: 0, lastDurationMs: 100, lastError: null };
    expect(healthOf(frankfurterSource, status, {}, now)).toBe("delayed");
  });
});
