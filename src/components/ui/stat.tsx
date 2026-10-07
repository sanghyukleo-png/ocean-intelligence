import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { cn, formatNum, type NumFormat } from "@/lib/utils";
import { AnimatedNumber } from "@/components/motion/animated-number";

/** 라벨 + 큰 숫자 + 델타. 숫자는 값이 바뀌면 보간된다. */
export function Stat({
  label,
  value,
  format,
  unit,
  delta,
  deltaFormat = { decimals: 1, suffix: "%", signed: true },
  /** 델타가 양수일 때 좋은 방향인지 (운임·비용은 false, 관점에 따라 다르면 null = 중립색) */
  positiveIsGood = true,
  badge,
  size = "md",
  from,
  hint,
  tone = "default",
  className,
}: {
  label: React.ReactNode;
  value: number | null | undefined;
  format?: NumFormat;
  unit?: string;
  delta?: number | null;
  deltaFormat?: NumFormat;
  positiveIsGood?: boolean | null;
  badge?: React.ReactNode;
  size?: "sm" | "md" | "xl";
  from?: number;
  hint?: React.ReactNode;
  /** 값 색: 손익처럼 부호가 의미를 가질 때만 up/down. 색만으로 전달하지 말고 hint·라벨로도 표시 */
  tone?: "default" | "up" | "down" | "accent";
  className?: string;
}) {
  const hasDelta = delta !== undefined && delta !== null && Number.isFinite(delta);
  const dir = !hasDelta || delta === 0 ? "flat" : delta > 0 ? "up" : "down";
  const good = dir === "flat" || positiveIsGood === null ? null : (dir === "up") === positiveIsGood;
  const DeltaIcon = dir === "up" ? ArrowUpRight : dir === "down" ? ArrowDownRight : ArrowRight;

  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex min-h-5 items-center justify-between gap-2">
        <span className="type-label truncate text-fg-label">{label}</span>
        {badge}
      </div>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-2">
        <AnimatedNumber
          value={value}
          from={from}
          {...format}
          className={cn(
            "font-semibold tracking-tight",
            tone === "up" ? "text-up" : tone === "down" ? "text-down" : tone === "accent" ? "text-accent" : "text-fg",
            size === "xl" ? "type-num-xl" : size === "md" ? "text-[1.625rem] leading-tight" : "text-lg leading-tight"
          )}
        />
        {unit && <span className="text-xs text-fg-muted">{unit}</span>}
      </div>
      {(hasDelta || hint) && (
        <div className="mt-2 flex items-center gap-2 text-xs">
          {hasDelta && (
            <span
              className={cn(
                "num inline-flex items-center gap-1",
                good === null ? "text-fg-muted" : good ? "text-up" : "text-down"
              )}
            >
              <DeltaIcon size={13} strokeWidth={2} aria-hidden="true" />
              {formatNum(delta, deltaFormat)}
            </span>
          )}
          {hint && <span className="text-fg-muted">{hint}</span>}
        </div>
      )}
    </div>
  );
}
