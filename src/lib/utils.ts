import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number | undefined, opts?: Intl.NumberFormatOptions) {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", opts).format(value);
}

export function formatCompact(value: number | undefined) {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export interface NumFormat {
  /** 고정 소수 자릿수 (기본 0) */
  decimals?: number;
  prefix?: string;
  suffix?: string;
  /** 양수에 + 표시 */
  signed?: boolean;
}

/** 결과값 표시 공통 포맷. 값이 없으면 "—" */
export function formatNum(value: number | null | undefined, { decimals = 0, prefix = "", suffix = "", signed = false }: NumFormat = {}) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  const abs = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Math.abs(value));
  const rounded = Number(Math.abs(value).toFixed(decimals));
  const sign = value < 0 && rounded !== 0 ? "−" : signed && rounded !== 0 ? "+" : "";
  return `${sign}${prefix}${abs}${suffix}`;
}
