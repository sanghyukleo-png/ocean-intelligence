// CSS 토큰을 JS에서 참조할 때(지도 스타일·차트) 쓰는 이름과 의미.
// 실제 색 값은 globals.css가 유일한 원천이다. 런타임에 getComputedStyle로 읽는다.

export type RiskLevel = 0 | 1 | 2 | 3 | 4;

export const RISK_LEVELS: { level: RiskLevel; key: string; label: string; token: string }[] = [
  { level: 0, key: "normal", label: "정상", token: "--risk-0" },
  { level: 1, key: "watch", label: "관찰", token: "--risk-1" },
  { level: 2, key: "caution", label: "주의", token: "--risk-2" },
  { level: 3, key: "high", label: "높음", token: "--risk-3" },
  { level: 4, key: "closure-likely", label: "통제 가능성 높음", token: "--risk-4" },
];

export const MAP_TOKENS = [
  "--map-sea",
  "--map-land",
  "--map-coast",
  "--map-contour",
  "--map-graticule",
  "--map-label",
  "--map-route",
  "--map-route-alt",
  "--vessel-ais",
  "--vessel-sim",
] as const;

/** 현재 테마의 토큰 값을 읽는다 (MapLibre 스타일 생성용) */
export function readTokens<T extends string>(names: readonly T[]): Record<T, string> {
  const style = getComputedStyle(document.documentElement);
  return Object.fromEntries(names.map((n) => [n, style.getPropertyValue(n).trim()])) as Record<T, string>;
}
