import { MarketIndicator } from "@/types";
import { Card } from "@/components/ui/card";
import { TrendBadge } from "@/components/trend-badge";
import { Sparkline } from "@/components/sparkline";
import { cn, formatNumber } from "@/lib/utils";

const BORDER_COLOR: Record<MarketIndicator["direction"], string> = {
  up: "border-l-positive",
  down: "border-l-negative",
  flat: "border-l-border",
};

export function KpiCard({ indicator }: { indicator: MarketIndicator }) {
  const sparkColor =
    indicator.direction === "up"
      ? "var(--positive)"
      : indicator.direction === "down"
      ? "var(--negative)"
      : "var(--muted)";

  return (
    <Card className={cn("animate-fade-in-up border-l-4 hover:shadow-md", BORDER_COLOR[indicator.direction])}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-bold leading-snug text-foreground">{indicator.label}</p>
        <TrendBadge direction={indicator.direction} changePct={indicator.changePct} />
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="font-mono-num text-2xl font-semibold text-foreground">
          {formatNumber(indicator.value, { maximumFractionDigits: 1 })}
        </span>
        <span className="text-xs text-muted">{indicator.unit}</span>
      </div>
      <div className="mt-3">
        <Sparkline data={indicator.sparkline} color={sparkColor} />
      </div>
      {indicator.description && (
        <p className="mt-2 text-xs leading-relaxed text-muted">{indicator.description}</p>
      )}
    </Card>
  );
}
