"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { clamp, formatNumberInput, parseNumberInput, roundToStep } from "@/lib/input-parse";
import { inputBase, useField } from "@/components/ui/field";

/**
 * 숫자 입력: 천단위 표시, ↑/↓ 증감(Shift ×10), 단위 고정 접미사.
 * 편집 중에는 입력한 문자열을 그대로 두고, 포커스를 잃을 때 범위 보정·서식 적용.
 */
export function NumberInput({
  value,
  onValueChange,
  unit,
  step = 1,
  min,
  max,
  maxFractionDigits = 2,
  placeholder,
  className,
  id,
  disabled,
  "aria-label": ariaLabel,
}: {
  value: number | null;
  onValueChange: (value: number | null) => void;
  unit?: string;
  step?: number;
  min?: number;
  max?: number;
  maxFractionDigits?: number;
  placeholder?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
  "aria-label"?: string;
}) {
  const field = useField();
  const [draft, setDraft] = useState<string | null>(null);
  const display = draft ?? formatNumberInput(value, maxFractionDigits);

  // 저장값도 화면 표시 자릿수(maxFractionDigits)로 맞춘다 — 보이는 값과 계산에 쓰는 값이 달라지지 않게
  const settle = (x: number) => clamp(Number(roundToStep(x, step).toFixed(maxFractionDigits)), min, max);

  function commit(next: number | null) {
    if (next === null) {
      onValueChange(null);
      return;
    }
    onValueChange(settle(next));
  }

  function nudge(direction: 1 | -1, multiplier: number) {
    const base = parseNumberInput(display) ?? value ?? min ?? 0;
    const next = settle(base + direction * step * multiplier);
    onValueChange(next);
    if (draft !== null) setDraft(formatNumberInput(next, maxFractionDigits));
  }

  return (
    <div className={cn("relative", className)}>
      <input
        id={id ?? field?.id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        spellCheck={false}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-describedby={field?.describedBy}
        aria-invalid={field?.invalid || (draft !== null && draft.trim() !== "" && parseNumberInput(draft) === null) || undefined}
        placeholder={placeholder}
        value={display}
        onFocus={() => setDraft(formatNumberInput(value, maxFractionDigits))}
        onChange={(e) => {
          setDraft(e.target.value);
          const parsed = parseNumberInput(e.target.value);
          if (parsed !== null || e.target.value.trim() === "") onValueChange(parsed);
        }}
        onBlur={() => {
          if (draft !== null) commit(parseNumberInput(draft) ?? (draft.trim() === "" ? null : value));
          setDraft(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
            nudge(e.key === "ArrowUp" ? 1 : -1, e.shiftKey ? 10 : 1);
          } else if (e.key === "Enter") {
            (e.target as HTMLInputElement).blur();
          }
        }}
        className={cn(inputBase, "num text-right", unit ? "pr-[calc(0.75rem+var(--unit-w))]" : "")}
        style={unit ? ({ "--unit-w": `${Math.max(unit.length, 2) * 0.62 + 0.5}em` } as React.CSSProperties) : undefined}
      />
      {unit && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-3 flex items-center font-mono text-xs text-fg-muted"
        >
          {unit}
        </span>
      )}
    </div>
  );
}
