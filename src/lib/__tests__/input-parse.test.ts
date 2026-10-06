import { describe, expect, it } from "vitest";
import {
  clamp,
  formatLocalDateTime,
  formatNumberInput,
  parseLocalDateTime,
  parseNumberInput,
  roundToStep,
} from "@/lib/input-parse";

describe("parseNumberInput", () => {
  it.each([
    ["1,234.5", 1234.5],
    [" 35 000 ", 35000],
    ["-12", -12],
    ["+7", 7],
    [".5", 0.5],
    ["10.", 10],
    ["0", 0],
  ])("%s → %s", (raw, expected) => {
    expect(parseNumberInput(raw)).toBe(expected);
  });

  it.each(["", "-", ".", "abc", "1.2.3", "12a", "1e5"])("%s → null", (raw) => {
    expect(parseNumberInput(raw)).toBeNull();
  });
});

describe("formatNumberInput", () => {
  it("천단위 구분 + 뒤 0 제거", () => {
    expect(formatNumberInput(35000)).toBe("35,000");
    expect(formatNumberInput(1234.5)).toBe("1,234.5");
    expect(formatNumberInput(0.125, 2)).toBe("0.13");
    expect(formatNumberInput(null)).toBe("");
    expect(formatNumberInput(Number.NaN)).toBe("");
  });
});

describe("roundToStep / clamp", () => {
  it("부동소수 오차 제거", () => {
    expect(roundToStep(0.1 + 0.2, 0.1)).toBe(0.3);
    expect(roundToStep(13.500000001, 0.5)).toBe(13.5);
  });
  it("범위 제한", () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(clamp(-1, 0, 3)).toBe(0);
    expect(clamp(2)).toBe(2);
  });
});

describe("parseLocalDateTime", () => {
  it.each([
    ["2026-10-01 08:00", "2026-10-01T08:00"],
    ["2026-10-01T08:00", "2026-10-01T08:00"],
    ["2026/10/1 0800", "2026-10-01T08:00"],
    ["2026.10.01 8:05", "2026-10-01T08:05"],
    ["20261001 0800", "2026-10-01T08:00"],
  ])("%s → %s", (raw, expected) => {
    expect(parseLocalDateTime(raw)).toBe(expected);
  });

  it("24:00은 다음 날 00:00 (월말·연말 경계 포함)", () => {
    expect(parseLocalDateTime("2026-10-01 24:00")).toBe("2026-10-02T00:00");
    expect(parseLocalDateTime("2026-02-28 2400")).toBe("2026-03-01T00:00");
    expect(parseLocalDateTime("2026-12-31 24:00")).toBe("2027-01-01T00:00");
  });

  it.each(["2026-13-01 08:00", "2026-02-29 08:00", "2026-10-01 25:00", "2026-10-01 08:60", "2026-10-01 24:30", "어제 8시", ""])(
    "%s → null",
    (raw) => {
      expect(parseLocalDateTime(raw)).toBeNull();
    }
  );

  it("윤년 2월 29일 허용", () => {
    expect(parseLocalDateTime("2028-02-29 12:00")).toBe("2028-02-29T12:00");
  });

  it("표시 형식", () => {
    expect(formatLocalDateTime("2026-10-01T08:00")).toBe("2026-10-01 08:00");
    expect(formatLocalDateTime(null)).toBe("");
  });
});
