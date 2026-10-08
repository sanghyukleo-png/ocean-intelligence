import { describe, expect, it } from "vitest";
import { KMA_PORTS, MID_SEA_REGIONS } from "@/data/kmaPortZones";
import { KMA_MARINE_ZONES, zoneCodeByName, zoneWithAncestors } from "@/data/kmaZones";
import { latestStartTimes, parseActive, parsePreliminary, timeWordStartHour } from "@/lib/kma/warnings";
import { parseDataGoKr } from "@/lib/sources/datagokr";
import { buildWarningStatus, latestMidTmFc, parseMidSea } from "@/lib/sources/kma";

describe("특보구역 매핑", () => {
  it("항만의 모든 구역 코드가 특보구역코드표에 있다", () => {
    const codes = new Set(KMA_MARINE_ZONES.map((z) => z[0]));
    for (const p of KMA_PORTS) {
      for (const z of p.zones) expect(codes.has(z), `${p.name} ${z}`).toBe(true);
      expect(p.zones.some((z) => z.startsWith("S1")), `${p.name} 앞바다 구역`).toBe(true);
      expect(MID_SEA_REGIONS[p.midSeaRegId], `${p.name} 중기 구역`).toBeTruthy();
    }
  });

  it("국내 12개 항, 정유·석화 4곳", () => {
    expect(KMA_PORTS).toHaveLength(12);
    expect(KMA_PORTS.filter((p) => p.refinery).map((p) => p.id)).toEqual(["ulsan", "yeosu", "daesan", "incheon"]);
  });

  it("상위 구역 체인", () => {
    expect(zoneWithAncestors("S1131100")).toEqual(["S1131100", "S1131000", "S1130000", "S1100000"]);
    expect(zoneWithAncestors("S1323100")).toEqual(["S1323100", "S1323000", "S1330000", "S1300000"]);
  });

  it("구역명 표기 차이 흡수", () => {
    expect(zoneCodeByName("인천·경기남부앞바다")).toBe("S1251200");
    expect(zoneCodeByName("인천ㆍ경기남부앞바다")).toBe("S1251200");
    expect(zoneCodeByName("울릉도.독도")).toBeNull();
  });
});

describe("특보 통보문 해석 (활용가이드 예제)", () => {
  it("t6 발효 현황 — 육상 구역은 건너뛴다", () => {
    const t6 = "o 강풍주의보 : 울릉도.독도, 전라남도(거문도.초도)\n\t\t\t\t o 풍랑주의보 : 남해동부먼바다, 동해중부먼바다, 동해남부먼바다";
    const r = parseActive(t6);
    // 동해남부먼바다는 2021년 개편으로 남쪽/북쪽 안쪽·바깥 먼바다로 나뉘어 현행 코드표에 없다 → 매칭 안 됨
    expect(r.every((w) => w.kind === "풍랑" && w.level === "주의보")).toBe(true);
    expect(r.map((w) => w.zoneCode)).not.toContain(null);
  });

  it("t6 앞바다 괄호 = 괄호 안 하위 구역만", () => {
    const r = parseActive("o 풍랑경보 : 동해남부앞바다(울산앞바다), 부산앞바다\n o 풍랑주의보 : 충남북부앞바다");
    expect(r).toEqual([
      { zoneCode: "S1131100", kind: "풍랑", level: "경보" },
      { zoneCode: "S1311100", kind: "풍랑", level: "경보" },
      { zoneCode: "S1251300", kind: "풍랑", level: "주의보" },
    ]);
  });

  it("t6 없음", () => {
    expect(parseActive("o 없음")).toEqual([]);
    expect(parseActive("")).toEqual([]);
  });

  it("t7 예비특보 — 가이드 예제 문구", () => {
    const t7 = "(1) 풍랑 예비특보\n \t\t\t\to 06월 07일 아침 : 동해중부앞바다, 동해남부앞바다(경북북부앞바다, 경북남부앞바다)";
    const r = parsePreliminary(t7, "2017-06-06T22:30:00.000Z"); // 06/07 07:30 KST 발표
    expect(r.map((p) => p.zoneCode)).toEqual(["S1151000", "S1131300", "S1131200"]);
    expect(r[0].expectedAt).toBe("2017-06-06T21:00:00.000Z"); // 06/07 06:00 KST
    expect(r[0].timeApprox).toBe(false);
  });

  it("t7 여러 종류·여러 시각, 줄바꿈 없이 이어진 형식", () => {
    const t7 = "(1) 강풍 예비특보\t o 06월 07일 아침 : 울릉도.독도\t\t(2) 풍랑 예비특보\t o 06월 07일 아침 : 동해중부전해상, 동해남부먼바다 o 06월 08일 밤 : 부산앞바다";
    const r = parsePreliminary(t7, "2017-06-06T14:00:00.000Z");
    expect(r.map((p) => [p.kind, p.zoneCode, p.timeText])).toEqual([
      ["풍랑", "S1150000", "06월 07일 아침"],
      ["풍랑", "S1311100", "06월 08일 밤"],
    ]);
    expect(r[1].expectedAt).toBe("2017-06-08T09:00:00.000Z"); // 밤 = 18시 KST
  });

  it("12월 발표의 1월 예비특보는 다음 해", () => {
    const r = parsePreliminary("(1) 풍랑 예비특보 o 01월 01일 새벽 : 부산앞바다", "2026-12-31T05:00:00.000Z");
    expect(r[0].expectedAt).toBe("2026-12-31T15:00:00.000Z"); // 2027-01-01 00시 KST
  });

  it("시간범주 — 기상청 예보용어(가장 이른 시작)", () => {
    expect(timeWordStartHour("새벽")).toBe(0);
    expect(timeWordStartHour("늦은 새벽")).toBe(3);
    expect(timeWordStartHour("아침")).toBe(6);
    expect(timeWordStartHour("오전")).toBe(6);
    expect(timeWordStartHour("낮")).toBe(12);
    expect(timeWordStartHour("늦은 오후")).toBe(15);
    expect(timeWordStartHour("저녁")).toBe(18);
    expect(timeWordStartHour("밤")).toBe(18);
    expect(timeWordStartHour("밤늦게")).toBe(21);
    expect(timeWordStartHour("")).toBeNull();
  });

  it("특보코드조회 — 해제된 특보는 발효 시각에서 제외, 취소 건 무시", () => {
    const m = latestStartTimes([
      { areaCode: "S1131100", warnVar: 6, warnStress: 0, command: 1, startTime: "2026-10-07T21:00:00.000Z", endTime: null, tmFc: "202610080600", cancel: 0 },
      { areaCode: "S1311100", warnVar: 6, warnStress: 0, command: 1, startTime: "2026-10-07T10:00:00.000Z", endTime: null, tmFc: "202610071900", cancel: 0 },
      { areaCode: "S1311100", warnVar: 6, warnStress: 0, command: 2, startTime: null, endTime: "2026-10-07T20:00:00.000Z", tmFc: "202610080500", cancel: 0 },
      { areaCode: "S1131100", warnVar: 6, warnStress: 0, command: 2, startTime: null, endTime: null, tmFc: "202610080700", cancel: 1 },
    ]);
    expect(m.get("S1131100|6")).toBe("2026-10-07T21:00:00.000Z");
    expect(m.has("S1311100|6")).toBe(false);
  });

  it("특보현황 + 특보코드 → 현황(발효 시각 포함)", () => {
    const s = buildWarningStatus(
      [
        { tmFc: "202610080500", tmEf: "202610080600", t6: "o 풍랑주의보 : 울산앞바다", t7: "o 없음", other: "o 없음" },
        { tmFc: "202610071800", tmEf: "202610071900", t6: "o 없음", t7: "", other: "" },
      ],
      [{ areaCode: "S1131100", warnVar: 6, warnStress: 0, command: 1, startTime: "202610080600", tmFc: "202610080500", cancel: 0 }]
    )!;
    expect(s.announcedAt).toBe("2026-10-07T20:00:00.000Z");
    expect(s.active).toEqual([{ zoneCode: "S1131100", kind: "풍랑", level: "주의보", since: "2026-10-07T21:00:00.000Z" }]);
  });
});

describe("공공데이터포털 응답", () => {
  it("정상 JSON — item 단건·배열", () => {
    const one = parseDataGoKr(JSON.stringify({ response: { header: { resultCode: "00", resultMsg: "NORMAL_SERVICE" }, body: { items: { item: { a: 1 } }, totalCount: 1 } } }));
    expect(one.items).toEqual([{ a: 1 }]);
    const many = parseDataGoKr(JSON.stringify({ response: { header: { resultCode: "00" }, body: { items: { item: [{ a: 1 }, { a: 2 }] }, totalCount: 2 } } }));
    expect(many.items).toHaveLength(2);
  });

  it("NODATA(03)는 실패가 아니라 자료 없음", () => {
    const r = parseDataGoKr(JSON.stringify({ response: { header: { resultCode: "03", resultMsg: "NO_DATA" } } }));
    expect(r).toEqual({ items: [], totalCount: 0, noData: true });
  });

  it("게이트웨이 XML 오류 — 미등록 키는 인증 오류", () => {
    const xml =
      "<OpenAPI_ServiceResponse><cmmMsgHeader><errMsg>SERVICE ERROR</errMsg><returnAuthMsg>SERVICE_KEY_IS_NOT_REGISTERED_ERROR</returnAuthMsg><returnReasonCode>30</returnReasonCode></cmmMsgHeader></OpenAPI_ServiceResponse>";
    expect(() => parseDataGoKr(xml)).toThrowError(/SERVICE_KEY_IS_NOT_REGISTERED_ERROR/);
    try {
      parseDataGoKr(xml);
    } catch (e) {
      expect((e as { kind: string }).kind).toBe("auth");
    }
  });

  it("한도 초과(22)·JSON 헤더 오류", () => {
    expect(() => parseDataGoKr(JSON.stringify({ response: { header: { resultCode: "22", resultMsg: "LIMITED" } } }))).toThrowError(/LIMITED/);
    expect(() => parseDataGoKr("not json")).toThrowError(/JSON/);
  });
});

describe("중기해상예보", () => {
  it("발표 시각 선택(06·18시, 30분 여유)", () => {
    expect(latestMidTmFc(new Date("2026-10-07T21:10:00Z"))).toBe("202610071800"); // 06:10 KST → 전날 18시
    expect(latestMidTmFc(new Date("2026-10-07T21:40:00Z"))).toBe("202610080600"); // 06:40 KST
    expect(latestMidTmFc(new Date("2026-10-08T09:40:00Z"))).toBe("202610081800"); // 18:40 KST
  });

  it("날짜별 최고 파고 — 가이드 예제 값", () => {
    const item = { wh4BAm: "2", wh4BPm: "3", wh5BAm: "2", wh5BPm: "2", wh8B: "2", wh10B: "2" };
    const r = parseMidSea(item, "12A10000", "201404080600");
    expect(r.days[0]).toEqual({ date: "2014-04-12", waveMaxM: 3 });
    expect(r.days.map((d) => d.date)).toEqual(["2014-04-12", "2014-04-13", "2014-04-16", "2014-04-18"]);
  });
});
