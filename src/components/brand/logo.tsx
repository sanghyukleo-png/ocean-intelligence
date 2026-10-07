import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────
// OCEAN INTELLIGENCE 심볼 — 24×24 그리드, 선 굵기 1.75, 획 3개 이내.
// 모든 획은 currentColor. route 획만 accent로 바꿀 수 있다(tone="accent").
// ─────────────────────────────────────────────────────────────────────

export type LogoVariant = "meridian" | "gate" | "contour";

interface SymbolGeometry {
  /** 해역(원·경위선) 획 */
  frame: string[];
  /** 대권항로 획 — 원을 빠져나간다 */
  route: string;
  /** 출발항 점 (선택) */
  port?: { cx: number; cy: number; r: number };
}

export const LOGO_GEOMETRY: Record<LogoVariant, SymbolGeometry> = {
  // A. 자오선 — 원 + 위도선 1개 + 원 밖으로 휘어 나가는 대권항로
  meridian: {
    frame: ["M12 3.5a8.5 8.5 0 1 0 0 17a8.5 8.5 0 1 0 0-17", "M4.2 15.2C8.6 17.3 15.4 17.3 19.8 15.2"],
    route: "M5.9 17.9C8.4 11.2 13.6 6.3 22 3.6",
  },
  // B. 관문 — 우상단이 열린 원, 출발항 점에서 열린 틈으로 빠져나가는 항로
  gate: {
    frame: ["M19.99 9.09A8.5 8.5 0 1 1 14.91 4.01"],
    route: "M7.4 15.6C10.4 11.6 14.2 8.4 21 3.6",
    port: { cx: 7.4, cy: 15.6, r: 1.6 },
  },
  // C. 등심선 — 원 + 안쪽 등심선 1개 + 원을 가로지르는 항로
  contour: {
    frame: [
      "M12 3.5a8.5 8.5 0 1 0 0 17a8.5 8.5 0 1 0 0-17",
      "M8.3 11.4C8.3 8.6 11.6 7.6 13.9 8.7C16.4 9.9 16.5 13.5 14.2 14.9C11.8 16.3 8.3 14.6 8.3 11.4Z",
    ],
    route: "M1.6 16.4C8 19.6 16.2 16.2 22.4 7.6",
  },
};

export const DEFAULT_LOGO_VARIANT: LogoVariant = "gate";

export function LogoSymbol({
  variant = DEFAULT_LOGO_VARIANT,
  size = 24,
  tone = "accent",
  className,
  title,
}: {
  variant?: LogoVariant;
  size?: number;
  /** accent: 항로 획만 강조색 · mono: 전부 currentColor */
  tone?: "accent" | "mono";
  className?: string;
  title?: string;
}) {
  const g = LOGO_GEOMETRY[variant];
  const routeColor = tone === "accent" ? "var(--accent)" : "currentColor";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("shrink-0", className)}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {g.frame.map((d) => (
        <path key={d} d={d} />
      ))}
      <path d={g.route} stroke={routeColor} />
      {g.port && <circle cx={g.port.cx} cy={g.port.cy} r={g.port.r} fill={routeColor} stroke="none" />}
    </svg>
  );
}

export function LogoWordmark({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap text-[0.8125rem] leading-none tracking-[0.14em] text-fg",
        className
      )}
    >
      <span className="font-semibold">OCEAN</span>
      {!compact && (
        <>
          {/* flex 안의 공백 텍스트는 배치에 영향이 없고, 보이는 텍스트를 "OCEAN INTELLIGENCE"로 만든다 */}{" "}
          <span aria-hidden="true" className="mx-[0.6em] h-[0.9em] w-px bg-line-strong" />
          <span className="font-normal text-fg-muted">INTELLIGENCE</span>
        </>
      )}
      {compact && <span className="sr-only"> INTELLIGENCE</span>}
    </span>
  );
}

export function Logo({
  variant = DEFAULT_LOGO_VARIANT,
  className,
  symbolSize = 24,
  compact = false,
}: {
  variant?: LogoVariant;
  className?: string;
  symbolSize?: number;
  /** 좁은 화면: INTELLIGENCE 생략 */
  compact?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 text-fg", className)}>
      <LogoSymbol variant={variant} size={symbolSize} />
      <LogoWordmark compact={compact} />
    </span>
  );
}

/** icon.svg · apple-icon · OG 이미지에서 쓰는 정적 SVG 문자열 */
export function logoSymbolSvg({
  variant = DEFAULT_LOGO_VARIANT,
  frameColor,
  routeColor,
  background,
  size = 24,
  padding = 0,
  radius = 0,
}: {
  variant?: LogoVariant;
  frameColor: string;
  routeColor: string;
  background?: string;
  size?: number;
  /** viewBox 단위(24 기준) 여백 */
  padding?: number;
  radius?: number;
}) {
  const g = LOGO_GEOMETRY[variant];
  const box = 24 + padding * 2;
  const bg = background
    ? `<rect x="${-padding}" y="${-padding}" width="${box}" height="${box}" rx="${radius}" fill="${background}"/>`
    : "";
  const frame = g.frame.map((d) => `<path d="${d}"/>`).join("");
  const port = g.port
    ? `<circle cx="${g.port.cx}" cy="${g.port.cy}" r="${g.port.r}" fill="${routeColor}" stroke="none"/>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${-padding} ${-padding} ${box} ${box}" fill="none" stroke="${frameColor}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${bg}${frame}<path d="${g.route}" stroke="${routeColor}"/>${port}</svg>`;
}
