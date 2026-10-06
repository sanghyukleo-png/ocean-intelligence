"use client";

import { useEffect, useRef, useState } from "react";
import { easeOutExpo, prefersReducedMotion } from "@/lib/motion";
import { formatNum, type NumFormat } from "@/lib/utils";

/**
 * 값이 바뀌면 이전 값에서 새 값으로 보간한다(기본 320ms). tabular-nums라 폭이 흔들리지 않는다.
 * 매 프레임 리렌더 대신 textContent를 직접 갱신한다.
 */
export function AnimatedNumber({
  value,
  from,
  duration = 320,
  delay = 0,
  className,
  decimals,
  prefix,
  suffix,
  signed,
}: {
  value: number | null | undefined;
  /** 첫 마운트 시 이 값에서 카운트업 */
  from?: number;
  duration?: number;
  delay?: number;
  className?: string;
} & NumFormat) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef<number | null>(from ?? value ?? null);
  // 텍스트는 첫 렌더 값으로 고정하고 이후는 effect가 직접 갱신한다.
  // (React가 값을 바로 덮어써 최종값이 한 프레임 번쩍이는 것을 막는다)
  const [initialText] = useState(() => formatNum(from ?? value, { decimals, prefix, suffix, signed }));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const format: NumFormat = { decimals, prefix, suffix, signed };
    const target = value ?? null;
    const start = shown.current;

    if (target === null || start === null || prefersReducedMotion() || start === target) {
      shown.current = target;
      el.textContent = formatNum(target, format);
      return;
    }

    let raf = 0;
    let t0 = 0;
    const timer = window.setTimeout(() => {
      const tick = (now: number) => {
        if (!t0) t0 = now;
        const p = Math.min(1, (now - t0) / duration);
        const v = start + (target - start) * easeOutExpo(p);
        shown.current = v;
        el.textContent = formatNum(v, format);
        if (p < 1) raf = requestAnimationFrame(tick);
        else shown.current = target;
      };
      raf = requestAnimationFrame(tick);
    }, delay);

    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [value, duration, delay, decimals, prefix, suffix, signed]);

  return (
    <span ref={ref} className={className ? `num ${className}` : "num"}>
      {initialText}
    </span>
  );
}
