import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { SignalImportance } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const IMPORTANCE_LABEL_KO: Record<SignalImportance, string> = {
  high: "높음",
  medium: "보통",
  low: "낮음",
};

export function formatNumber(value: number | undefined, opts?: Intl.NumberFormatOptions) {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", opts).format(value);
}

export function formatCompact(value: number | undefined) {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}
