"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatLocalDateTime, parseLocalDateTime } from "@/lib/input-parse";
import { inputBase, useField } from "@/components/ui/field";

/**
 * 현지시각 24시간제 입력. 값은 "YYYY-MM-DDTHH:mm"(오프셋 없음).
 * 브라우저 datetime-local은 로캘에 따라 오전/오후가 섞이므로 텍스트 입력으로 고정한다.
 * 허용: 2026-10-01 08:00 · 2026/10/01 0800 · 20261001 0800 · 24:00(다음 날 00:00)
 */
export function DateTimeInput({
  value,
  onValueChange,
  className,
  id,
  disabled,
  placeholder = "YYYY-MM-DD HH:mm",
  "aria-label": ariaLabel,
}: {
  value: string | null;
  onValueChange: (value: string | null) => void;
  className?: string;
  id?: string;
  disabled?: boolean;
  placeholder?: string;
  "aria-label"?: string;
}) {
  const field = useField();
  const [draft, setDraft] = useState<string | null>(null);
  const display = draft ?? formatLocalDateTime(value);
  const invalid = draft !== null && draft.trim() !== "" && parseLocalDateTime(draft) === null;

  return (
    <input
      id={id ?? field?.id}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      spellCheck={false}
      disabled={disabled}
      placeholder={placeholder}
      aria-label={ariaLabel}
      aria-describedby={field?.describedBy}
      aria-invalid={field?.invalid || invalid || undefined}
      value={display}
      onChange={(e) => {
        setDraft(e.target.value);
        const parsed = parseLocalDateTime(e.target.value);
        if (parsed) onValueChange(parsed);
        else if (e.target.value.trim() === "") onValueChange(null);
      }}
      onBlur={() => {
        if (draft !== null && parseLocalDateTime(draft)) setDraft(null);
        else if (draft !== null && draft.trim() === "") setDraft(null);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
      className={cn(inputBase, "num tracking-tight", className)}
    />
  );
}
