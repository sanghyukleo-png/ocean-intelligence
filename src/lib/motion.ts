// 모션 원칙: 빠르고, 짧고, 의미 있게. transform·opacity만 움직인다.
export const EASE_OUT = [0.16, 1, 0.3, 1] as const; // 진입
export const EASE_IN = [0.7, 0, 0.84, 0] as const; // 종료

export const DURATION = {
  fast: 0.16,
  base: 0.32,
  slow: 0.48,
} as const;

export const STAGGER = 0.06;
export const REVEAL_OFFSET = 12; // px

/** CSS 이징과 같은 곡선 (requestAnimationFrame 보간용) */
export function easeOutExpo(t: number) {
  // cubic-bezier(0.16, 1, 0.3, 1)에 가까운 지수 감쇠
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
