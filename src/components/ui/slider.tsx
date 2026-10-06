"use client";

import { useId } from "react";
import { cn, formatNum, type NumFormat } from "@/lib/utils";

export function Slider({
  label,
  value,
  min,
  max,
  step,
  onValueChange,
  format,
  className,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onValueChange: (value: number) => void;
  format?: NumFormat;
  className?: string;
}) {
  const id = useId();
  const pct = max === min ? 0 : ((value - min) / (max - min)) * 100;
  const text = formatNum(value, format);

  return (
    <div className={cn("min-w-0", className)}>
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="type-label text-fg-muted">
          {label}
        </label>
        <output htmlFor={id} className="num text-sm text-fg">
          {text}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={text}
        onChange={(e) => onValueChange(Number(e.target.value))}
        className="oi-range"
        style={{ "--pct": `${pct}%` } as React.CSSProperties}
      />
      <div aria-hidden="true" className="num mt-0.5 flex justify-between text-[0.6875rem] text-fg-faint">
        <span>{formatNum(min, format)}</span>
        <span>{formatNum(max, format)}</span>
      </div>
    </div>
  );
}
