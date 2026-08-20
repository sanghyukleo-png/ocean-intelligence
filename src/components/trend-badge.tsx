import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { TrendDirection } from "@/types";

export function TrendBadge({
  direction,
  changePct,
  className,
}: {
  direction: TrendDirection;
  changePct: number;
  className?: string;
}) {
  const Icon = direction === "up" ? ArrowUp : direction === "down" ? ArrowDown : ArrowRight;
  const color =
    direction === "up"
      ? "text-positive"
      : direction === "down"
      ? "text-negative"
      : "text-muted";

  return (
    <span className={cn("inline-flex items-center gap-0.5 font-mono-num text-xs", color, className)}>
      <Icon size={12} strokeWidth={2.5} />
      {Math.abs(changePct).toFixed(1)}%
    </span>
  );
}
