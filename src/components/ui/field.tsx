"use client";

import { createContext, useContext, useId } from "react";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/tooltip";

interface FieldContextValue {
  id: string;
  describedBy?: string;
  invalid: boolean;
}

const FieldContext = createContext<FieldContextValue | null>(null);

/** 입력 컴포넌트가 Field 안에 있으면 id·aria-describedby·aria-invalid를 자동 연결한다 */
export function useField() {
  return useContext(FieldContext);
}

export function Field({
  label,
  hint,
  error,
  tip,
  aside,
  className,
  children,
}: {
  label: React.ReactNode;
  /** 필드 아래 도움말 */
  hint?: React.ReactNode;
  error?: React.ReactNode;
  /** 라벨 옆 ? 툴팁 (예: "C/P 확인") */
  tip?: React.ReactNode;
  /** 라벨 행 오른쪽 (배지·보조 버튼) */
  aside?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <FieldContext.Provider value={{ id, describedBy, invalid: Boolean(error) }}>
      <div className={cn("min-w-0", className)}>
        <div className="mb-2 flex min-h-4 items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-2">
            <label htmlFor={id} className="type-label truncate text-fg-label">
              {label}
            </label>
            {tip && <Tooltip content={tip} label={typeof label === "string" ? `${label} 설명` : "설명"} />}
          </span>
          {aside}
        </div>
        {children}
        {error ? (
          <p id={errorId} className="mt-2 text-xs text-down">
            {error}
          </p>
        ) : hint ? (
          <p id={hintId} className="mt-2 text-xs leading-relaxed text-fg-muted">
            {hint}
          </p>
        ) : null}
      </div>
    </FieldContext.Provider>
  );
}

/** 입력 공통 스타일: 40px(데스크톱) · 44px(모바일) */
export const inputBase =
  "h-11 w-full min-w-0 rounded-lg border border-line bg-inset px-3 text-sm text-fg outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-fg-faint hover:border-line-strong focus:border-accent focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--accent)_18%,transparent)] disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-down md:h-10";

export function TextInput({ className, id, ...props }: React.ComponentProps<"input">) {
  const field = useField();
  return (
    <input
      id={id ?? field?.id}
      aria-describedby={field?.describedBy}
      aria-invalid={field?.invalid || undefined}
      className={cn(inputBase, className)}
      {...props}
    />
  );
}

export function TextArea({ className, id, ...props }: React.ComponentProps<"textarea">) {
  const field = useField();
  return (
    <textarea
      id={id ?? field?.id}
      aria-describedby={field?.describedBy}
      aria-invalid={field?.invalid || undefined}
      className={cn(inputBase, "h-auto min-h-28 resize-y py-3 font-mono text-[0.8125rem] leading-relaxed md:h-auto", className)}
      {...props}
    />
  );
}
