"use client";

import { m, type Variants } from "motion/react";
import { DURATION, EASE_OUT, REVEAL_OFFSET, STAGGER } from "@/lib/motion";

type Tag = "div" | "section" | "li" | "ul" | "article";

const VIEWPORT = { once: true, margin: "0px 0px -8% 0px" } as const;

// 서버·클라이언트가 항상 같은 요소를 렌더한다(하이드레이션 일치).
// prefers-reduced-motion과 JS 비활성 환경에서는 globals.css / layout의 [data-reveal] 규칙이
// 인라인 opacity·transform을 덮어써 즉시 보이게 한다.

/** 뷰포트 진입 시 12px 상승 + 페이드, 1회 */
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
  const Comp = m[as];
  return (
    <Comp
      data-reveal=""
      className={className}
      initial={{ opacity: 0, y: REVEAL_OFFSET }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: DURATION.slow, ease: EASE_OUT, delay }}
    >
      {children}
    </Comp>
  );
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: REVEAL_OFFSET },
  show: { opacity: 1, y: 0, transition: { duration: DURATION.slow, ease: EASE_OUT } },
};

/** 형제 요소 60ms 간격 순차 리빌. 자식은 <StaggerItem>으로 감싼다. */
export function Stagger({
  as = "div",
  className,
  children,
  delay = 0,
}: {
  as?: Tag;
  className?: string;
  children: React.ReactNode;
  delay?: number;
}) {
  const Comp = m[as];
  return (
    <Comp
      className={className}
      variants={{ hidden: {}, show: { transition: { staggerChildren: STAGGER, delayChildren: delay } } }}
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT}
    >
      {children}
    </Comp>
  );
}

export function StaggerItem({
  as = "div",
  className,
  children,
}: {
  as?: Tag;
  className?: string;
  children: React.ReactNode;
}) {
  const Comp = m[as];
  return (
    <Comp data-reveal="" className={className} variants={itemVariants}>
      {children}
    </Comp>
  );
}
