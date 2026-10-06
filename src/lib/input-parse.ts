// 입력 필드용 순수 파서·포매터. UI 컴포넌트(NumberInput, DateTimeInput)와 붙여넣기 파서가 공유한다.

/** "1,234.5" · " 35 000 " · "-12" → number. 빈 값·잘못된 값 → null */
export function parseNumberInput(raw: string): number | null {
  const cleaned = raw.replace(/[,\s_]/g, "").replace(/^\+/, "");
  if (cleaned === "" || cleaned === "-" || cleaned === ".") return null;
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** 천단위 구분 표시. 소수 자릿수는 최대값만 제한(뒤 0 제거) */
export function formatNumberInput(value: number | null | undefined, maxFractionDigits = 2): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: maxFractionDigits, useGrouping: true }).format(value);
}

/** step의 소수 자릿수에 맞춰 반올림 (0.1 + 0.2 문제 방지) */
export function roundToStep(value: number, step: number): number {
  const decimals = (step.toString().split(".")[1] ?? "").length;
  const f = 10 ** Math.min(decimals + 2, 10);
  return Math.round(value * f) / f;
}

export function clamp(value: number, min = -Infinity, max = Infinity): number {
  return Math.min(max, Math.max(min, value));
}

const pad2 = (n: number) => n.toString().padStart(2, "0");

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * 현지시각 문자열을 "YYYY-MM-DDTHH:mm"(오프셋 없음)로 정규화한다.
 * 허용: "2026-10-01 08:00" · "2026-10-01T08:00" · "2026/10/01 0800" · "2026.10.01 08:00" · "20261001 0800"
 * "24:00"은 다음 날 00:00으로 넘긴다(SOF 관행).
 */
export function parseLocalDateTime(raw: string): string | null {
  const s = raw.trim();
  const m =
    s.match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})[\sT]+(\d{1,2}):?(\d{2})$/) ??
    s.match(/^(\d{4})(\d{2})(\d{2})[\sT]+(\d{2}):?(\d{2})$/);
  if (!m) return null;
  const parts = m.slice(1).map(Number);
  const minute = parts[4];
  let [year, month, day, hour] = parts;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > daysInMonth(year, month)) return null;
  if (minute > 59) return null;
  if (hour > 24 || (hour === 24 && minute !== 0)) return null;
  if (hour === 24) {
    const next = new Date(Date.UTC(year, month - 1, day + 1));
    year = next.getUTCFullYear();
    month = next.getUTCMonth() + 1;
    day = next.getUTCDate();
    hour = 0;
  }
  return `${year}-${pad2(month)}-${pad2(day)}T${pad2(hour)}:${pad2(minute)}`;
}

/** "YYYY-MM-DDTHH:mm" → "YYYY-MM-DD HH:mm" */
export function formatLocalDateTime(value: string | null | undefined): string {
  if (!value) return "";
  return value.replace("T", " ");
}
