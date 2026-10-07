"use client";

import { useEffect, useRef } from "react";

type Tag = "div" | "section" | "li" | "ul" | "article";
type A11yProps = { role?: string; "aria-label"?: string; "aria-labelledby"?: string };

// 스크롤 리빌: IntersectionObserver가 data-shown을 붙이고, 12px 상승 + 페이드는 globals.css가 처리한다(1회).
// 모션 라이브러리를 초기 번들에서 빼서 LCP 예산을 지킨다(지시서 3.6 — 초기 JS 추가분 제한).
// 서버·클라이언트가 같은 마크업을 렌더한다. prefers-reduced-motion·JS 비활성·인쇄에서는
// globals.css / layout의 [data-reveal] 규칙이 즉시 보이게 한다.

let observer: IntersectionObserver | null = null;

function observe(el: Element) {
  if (typeof IntersectionObserver === "undefined") {
    el.setAttribute("data-shown", "");
    return undefined;
  }
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.setAttribute("data-shown", "");
        observer?.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -8% 0px" }
  );
  observer.observe(el);
  return () => observer?.unobserve(el);
}

function useRevealRef() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    return el ? observe(el) : undefined;
  }, []);
  return ref;
}

const ms = (seconds: number) => `${Math.round(seconds * 1000)}ms`;

/** 뷰포트 진입 시 12px 상승 + 페이드, 1회. delay는 초 단위 */
export function Reveal({
  as = "div",
  delay = 0,
  className,
  children,
}: {
  as?: Tag;
  delay?: number;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRevealRef();
  const Comp = as as React.ElementType;
  return (
    <Comp
      ref={ref}
      data-reveal=""
      className={className}
      style={delay ? ({ "--reveal-delay": ms(delay) } as React.CSSProperties) : undefined}
    >
      {children}
    </Comp>
  );
}

/** 형제 요소 60ms 간격 순차 리빌. 자식은 <StaggerItem>으로 감싼다(순번은 CSS nth-child). */
export function Stagger({
  as = "div",
  className,
  children,
  delay = 0,
  ...a11y
}: {
  as?: Tag;
  className?: string;
  children: React.ReactNode;
  delay?: number;
} & A11yProps) {
  const ref = useRevealRef();
  const Comp = as as React.ElementType;
  return (
    <Comp
      ref={ref}
      {...a11y}
      data-stagger=""
      className={className}
      style={delay ? ({ "--stagger-delay": ms(delay) } as React.CSSProperties) : undefined}
    >
      {children}
    </Comp>
  );
}

export function StaggerItem({
  as = "div",
  className,
  children,
  ...a11y
}: {
  as?: Tag;
  className?: string;
  children: React.ReactNode;
} & A11yProps) {
  const Comp = as as React.ElementType;
  return (
    <Comp {...a11y} data-reveal="" className={className}>
      {children}
    </Comp>
  );
}
