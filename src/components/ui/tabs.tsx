"use client";

import { useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface TabItem<T extends string> {
  value: T;
  label: React.ReactNode;
  content?: React.ReactNode;
}

/** WAI-ARIA tabs: ←/→/Home/End 이동, 자동 활성화 */
export function Tabs<T extends string>({
  items,
  value: controlled,
  defaultValue,
  onValueChange,
  className,
  listClassName,
  "aria-label": ariaLabel,
}: {
  items: TabItem<T>[];
  value?: T;
  defaultValue?: T;
  onValueChange?: (value: T) => void;
  className?: string;
  listClassName?: string;
  "aria-label": string;
}) {
  const baseId = useId();
  const [uncontrolled, setUncontrolled] = useState<T>(defaultValue ?? items[0].value);
  const value = controlled ?? uncontrolled;
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const index = Math.max(0, items.findIndex((i) => i.value === value));
  const active = items[index];

  function select(i: number) {
    const v = items[i].value;
    if (controlled === undefined) setUncontrolled(v);
    onValueChange?.(v);
    refs.current[i]?.focus();
  }

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label={ariaLabel}
        className={cn("flex gap-1 overflow-x-auto border-b border-line [scrollbar-width:none]", listClassName)}
      >
        {items.map((item, i) => {
          const selected = i === index;
          return (
            <button
              key={item.value}
              ref={(el) => {
                refs.current[i] = el;
              }}
              id={`${baseId}-tab-${i}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${i}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => select(i)}
              onKeyDown={(e) => {
                const last = items.length - 1;
                const map: Record<string, number> = {
                  ArrowRight: i === last ? 0 : i + 1,
                  ArrowLeft: i === 0 ? last : i - 1,
                  Home: 0,
                  End: last,
                };
                if (e.key in map) {
                  e.preventDefault();
                  select(map[e.key]);
                }
              }}
              className={cn(
                "relative h-11 shrink-0 px-3 text-[0.8125rem] font-medium transition-colors md:h-10",
                "after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:origin-center after:rounded-full after:bg-accent after:transition-transform after:duration-[240ms] after:ease-[cubic-bezier(0.16,1,0.3,1)]",
                selected ? "text-fg after:scale-x-100" : "text-fg-muted after:scale-x-0 hover:text-fg"
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {active?.content !== undefined && (
        <div
          role="tabpanel"
          id={`${baseId}-panel-${index}`}
          aria-labelledby={`${baseId}-tab-${index}`}
          tabIndex={0}
          className="pt-4 focus-visible:outline-offset-4"
        >
          {active.content}
        </div>
      )}
    </div>
  );
}
