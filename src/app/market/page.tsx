import { mockMarketIndicators, mockMarketSignals } from "@/data/mockMarket";
import { KpiCard } from "@/components/kpi-card";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";

const DIRECTION_ICON = { up: ArrowUp, down: ArrowDown, flat: ArrowRight };

export default function MarketPage() {
  return (
    <div className="space-y-10">
      <section>
        <p className="text-xs font-medium tracking-[0.16em] text-accent">MACRO INTELLIGENCE</p>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">Market</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Simulated fleet, orderbook, and freight indicators tracked across the merchant fleet.
          All values below are demo/simulated data and do not represent live market information.
        </p>
      </section>

      <section>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {mockMarketIndicators.map((ind) => (
            <KpiCard key={ind.id} indicator={ind} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold tracking-wide text-foreground">Market Signals</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {mockMarketSignals.map((s) => {
            const Icon = DIRECTION_ICON[s.direction];
            return (
              <Card key={s.id} className="animate-fade-in-up">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <span
                      className={cn(
                        "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded",
                        s.direction === "up"
                          ? "bg-positive/10 text-positive"
                          : s.direction === "down"
                          ? "bg-negative/10 text-negative"
                          : "bg-surface-2 text-muted"
                      )}
                    >
                      <Icon size={13} strokeWidth={2.5} />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{s.title}</p>
                      <p className="text-[11px] font-mono-num text-muted">{s.segment}</p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                      s.importance === "high"
                        ? "border-warning/40 bg-warning/10 text-warning"
                        : s.importance === "medium"
                        ? "border-accent/40 bg-accent/10 text-accent"
                        : "border-border bg-surface-2 text-muted"
                    )}
                  >
                    {s.importance}
                  </span>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-muted">{s.summary}</p>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
