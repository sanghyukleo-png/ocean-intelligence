import { describe, expect, it } from "vitest";
import { KMA_PORTS } from "@/data/kmaPortZones";
import { evaluatePortRisk, type Feed, type MidSeaDay } from "@/lib/portRisk";
import type { WarningStatus } from "@/lib/kma/warnings";
import { parsePreliminary } from "@/lib/kma/warnings";

// 지시서 11.4 검증 케이스
const ULSAN = KMA_PORTS.find((p) => p.id === "ulsan")!;
const NOW = new Date("2026-10-08T00:00:00Z"); // 09:00 KST

function status(partial: Partial<WarningStatus>): Feed<WarningStatus> {
  const data: WarningStatus = {
    announcedAt: "2026-10-07T22:00:00.000Z",
    effectiveAt: "2026-10-07T22:00:00.000Z",
    active: [],
    preliminary: [],
    raw: { t6: "", t7: "", other: "" },
    ...partial,
  };
  return { state: "ok", data, asOf: data.announcedAt, fetchedAt: "2026-10-07T23:59:00.000Z" };
}

const calmMid: Feed<MidSeaDay[]> = { state: "ok", data: [{ date: "2026-10-12", waveMaxM: 2 }], asOf: "2026-10-07T21:00:00Z", fetchedAt: "2026-10-07T21:10:00Z" };

describe("portRisk — 11.4 검증 케이스", () => {
  it("특보 없음 + 예보 임계값 미만 → 정상", () => {
    const r = evaluatePortRisk({
      now: NOW,
      port: ULSAN,
      warnings: status({}),
      shortTerm: { state: "ok", data: [{ at: "2026-10-08T06:00:00Z", windKt: 18, waveM: 1.2 }], asOf: "x", fetchedAt: "x" },
      midSea: calmMid,
      typhoonNear: { state: "ok", data: false, asOf: "x", fetchedAt: "x" },
    });
    expect(r.level).toBe(0);
    expect(r.failure).toBeNull();
    expect(r.reasons).toHaveLength(0);
  });

  it("풍랑주의보 발효 → 높음, 근거에 발효 시각", () => {
    const since = "2026-10-07T21:00:00.000Z";
    const r = evaluatePortRisk({
      now: NOW,
      port: ULSAN,
      warnings: status({ active: [{ zoneCode: "S1131100", kind: "풍랑", level: "주의보", since }] }),
      midSea: calmMid,
    });
    expect(r.level).toBe(3);
    expect(r.reasons[0].text).toContain("풍랑주의보");
    expect(r.reasons[0].validFrom).toBe(since);
  });

  it("상위 구역(동해남부앞바다)에 내린 특보도 울산에 적용, 먼바다 특보는 제외", () => {
    const upper = evaluatePortRisk({ now: NOW, port: ULSAN, warnings: status({ active: [{ zoneCode: "S1131000", kind: "풍랑", level: "주의보", since: null }] }) });
    expect(upper.level).toBe(3);
    const far = evaluatePortRisk({ now: NOW, port: ULSAN, warnings: status({ active: [{ zoneCode: "S1132110", kind: "풍랑", level: "경보", since: null }] }) });
    expect(far.level).toBe(0);
  });

  it("예비특보(발효 예정 30시간 후) → 주의, 12시간 뒤 재평가 → 높음", () => {
    const expectedAt = new Date(NOW.getTime() + 30 * 3600_000).toISOString();
    const feed = status({ preliminary: [{ zoneCode: "S1131100", kind: "풍랑", expectedAt, timeText: "10월 09일 오후", timeApprox: false }] });
    expect(evaluatePortRisk({ now: NOW, port: ULSAN, warnings: feed }).level).toBe(2);
    const later = new Date(NOW.getTime() + 12 * 3600_000);
    expect(evaluatePortRisk({ now: later, port: ULSAN, warnings: feed }).level).toBe(3);
  });

  it("태풍경보 → 통제 중 가능성 높음", () => {
    const r = evaluatePortRisk({ now: NOW, port: ULSAN, warnings: status({ active: [{ zoneCode: "S1131100", kind: "태풍", level: "경보", since: null }] }) });
    expect(r.level).toBe(4);
  });

  it("태풍주의보·풍랑경보도 통제 중 가능성 높음", () => {
    for (const w of [
      { kind: "태풍", level: "주의보" },
      { kind: "풍랑", level: "경보" },
    ] as const) {
      const r = evaluatePortRisk({ now: NOW, port: ULSAN, warnings: status({ active: [{ zoneCode: "S1131100", ...w, since: null }] }) });
      expect(r.level).toBe(4);
    }
  });

  it("기상청 API 실패 → 정상이 아니라 수집 실패 · 마지막 성공 시각", () => {
    const r = evaluatePortRisk({ now: NOW, port: ULSAN, warnings: { state: "failed", lastSuccessAt: "2026-10-07T20:00:00Z", error: "시간 초과" } });
    expect(r.level).toBeNull();
    expect(r.failure).toEqual({ kind: "failed", lastSuccessAt: "2026-10-07T20:00:00Z", error: "시간 초과" });
    expect(r.horizon).toEqual([null, null, null]);
  });

  it("키 미설정 → 등급 없음(nokey)", () => {
    const r = evaluatePortRisk({ now: NOW, port: ULSAN, warnings: { state: "nokey" } });
    expect(r.level).toBeNull();
    expect(r.failure).toEqual({ kind: "nokey" });
  });

  it("중기해상예보 3m 이상 → 관찰, 단기예보 임계값 초과 → 주의", () => {
    const mid = evaluatePortRisk({
      now: NOW,
      port: ULSAN,
      warnings: status({}),
      midSea: { state: "ok", data: [{ date: "2026-10-13", waveMaxM: 3.5 }], asOf: "x", fetchedAt: "x" },
    });
    expect(mid.level).toBe(1);
    expect(mid.mid).toBe(1);
    const short = evaluatePortRisk({
      now: NOW,
      port: ULSAN,
      warnings: status({}),
      shortTerm: { state: "ok", data: [{ at: "2026-10-08T09:00:00Z", windKt: 27 }], asOf: "x", fetchedAt: "x" },
    });
    expect(short.level).toBe(2);
  });

  it("평택·당진은 두 앞바다 중 높은 쪽", () => {
    const pt = KMA_PORTS.find((p) => p.id === "pyeongtaek")!;
    const r = evaluatePortRisk({ now: NOW, port: pt, warnings: status({ active: [{ zoneCode: "S1251300", kind: "풍랑", level: "주의보", since: null }] }) });
    expect(r.level).toBe(3);
  });

  it("통보문 → 예비특보 → 등급까지 이어서", () => {
    // 10/07 23:00 KST 발표, "10월 09일 오후"(12시 KST) = 발표 기준 37시간 뒤
    const prelim = parsePreliminary("(1) 풍랑 예비특보 o 10월 09일 오후 : 동해남부앞바다(울산앞바다, 경북남부앞바다)", "2026-10-07T14:00:00.000Z");
    expect(prelim.map((p) => p.zoneCode)).toEqual(["S1131100", "S1131200"]);
    expect(prelim[0].expectedAt).toBe("2026-10-09T03:00:00.000Z");
    const r = evaluatePortRisk({ now: NOW, port: ULSAN, warnings: status({ preliminary: prelim }) });
    expect(r.level).toBe(2); // 27시간 남음 → 주의
  });
});
