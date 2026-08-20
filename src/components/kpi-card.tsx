import { MarketIndicator } from "@/types";
import { Card, CardLabel } from "@/components/ui/card";
import { TrendBadge } from "@/components/trend-badge";
import { Sparkline } from "@/components/sparkline";
import { formatNumber } from "@/lib/utils";

export function KpiCard({ indicator }: { indicator: MarketIndicator }) {
  const sparkColor =
    indicator.direction === "up"
      ? "var(--positive)"
      : indicator.direction === "down"
      ? "var(--negative)"
      : "var(--muted)";

  return (
    <Card className="animate-fade-in-up hover:border-accent/30">
      <div className="flex items-start justify-between">
        <CardLabel>{indicator.label}</CardLabel>
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
