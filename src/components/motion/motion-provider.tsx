"use client";

import { LazyMotion, MotionConfig, domAnimation } from "motion/react";

// domAnimation 기능만 지연 로드해 초기 JS를 줄인다. 컴포넌트는 `m.*`만 사용한다.
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
