import Link from "next/link";
import { mockOpportunities } from "@/data/mockOpportunities";
import { scoreAllOpportunities, TIER_COLOR } from "@/lib/scoring";
import { Card, CardLabel } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function OpportunitiesPage() {
  const scored = scoreAllOpportunities(mockOpportunities);

  return (
    <div className="space-y-8">
      <section>
        <p className="text-xs font-medium tracking-[0.16em] text-accent">SALES OPPORTUNITY RADAR</p>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">Opportunities</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Customers ranked by a deterministic Opportunity Score. Rules calculate the score — AI
          only explains it and recommends a next action. Demo data / fictional customer names.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-3">
        {scored.map((o) => (
          <Link href={`/opportunities/${o.id}`} key={o.id}>
            <Card className="animate-fade-in-up cursor-pointer hover:border-accent/40">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{o.customer}</p>
                  <p className="text-xs text-muted">
                    {o.country} · {o.segment}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {o.signals.slice(0, 3).map((sig) => (
                      <span
                        key={sig}
                        className="rounded border border-border bg-surface-2 px-1.5 py-0.5 text-[10px] text-muted"
                      >
                        {sig}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-6">
                  <div className="hidden text-right sm:block">
                    <CardLabel>Fleet</CardLabel>
                    <p className="font-mono-num text-sm text-foreground">{o.fleetSize} vessels</p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <CardLabel>Avg Age</CardLabel>
                    <p className="font-mono-num text-sm text-foreground">{o.averageFleetAge.toFixed(1)} yrs</p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <CardLabel>Orderbook</CardLabel>
                    <p className="font-mono-num text-sm text-foreground">{o.orderbook}</p>
                  </div>
                  <div
                    className={cn(
                      "flex w-24 flex-col items-center rounded-md border px-3 py-2",
                      TIER_COLOR[o.tier]
                    )}
                  >
                    <span className="font-mono-num text-xl font-bold leading-none">{o.score}</span>
                    <span className="mt-1 text-[10px] font-semibold tracking-wide">{o.tier}</span>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </section>
    </div>
  );
}
