import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { mockOpportunities } from "@/data/mockOpportunities";
import { mockMarketSignals } from "@/data/mockMarket";
import { explainScore, scoreOpportunity, SCORE_WEIGHTS, TIER_COLOR } from "@/lib/scoring";
import { Card, CardLabel } from "@/components/ui/card";
import { FactorBar } from "@/components/factor-bar";
import { SalesBriefPanel } from "@/components/sales-brief-panel";
import { cn } from "@/lib/utils";

export function generateStaticParams() {
  return mockOpportunities.map((o) => ({ id: o.id }));
}

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const opportunity = mockOpportunities.find((o) => o.id === id);
  if (!opportunity) notFound();

  const scored = scoreOpportunity(opportunity);
  const explanation = explainScore(opportunity, scored.score, scored.tier);

  return (
    <div className="space-y-8">
      <Link
        href="/opportunities"
        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground"
      >
        <ArrowLeft size={13} />
        Back to Opportunities
      </Link>

      <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium tracking-[0.16em] text-accent">
            {opportunity.segment.toUpperCase()}
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-foreground">{opportunity.customer}</h1>
          <p className="mt-1 text-sm text-muted">{opportunity.country}</p>
        </div>
        <div className={cn("flex flex-col items-center rounded-lg border px-6 py-3", TIER_COLOR[scored.tier])}>
          <span className="font-mono-num text-3xl font-bold leading-none">{scored.score}</span>
          <span className="mt-1 text-[11px] font-semibold tracking-wide">{scored.tier}</span>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card>
          <CardLabel>Fleet Size</CardLabel>
          <p className="mt-1 font-mono-num text-xl text-foreground">{opportunity.fleetSize}</p>
        </Card>
        <Card>
          <CardLabel>Average Age</CardLabel>
          <p className="mt-1 font-mono-num text-xl text-foreground">{opportunity.averageFleetAge.toFixed(1)} yrs</p>
        </Card>
        <Card>
          <CardLabel>Orderbook</CardLabel>
          <p className="mt-1 font-mono-num text-xl text-foreground">{opportunity.orderbook} vessels</p>
        </Card>
        <Card>
          <CardLabel>Fuel Transition</CardLabel>
          <p className="mt-1 font-mono-num text-xl text-foreground">{opportunity.fuelTransitionPct}%</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <h3 className="mb-4 text-sm font-semibold text-foreground">Opportunity Score Breakdown</h3>
            <div className="space-y-3">
              <FactorBar label="Fleet Age" value={opportunity.factors.fleetAge} weightPct={SCORE_WEIGHTS.fleetAge * 100} />
              <FactorBar label="Orderbook Gap" value={opportunity.factors.orderbookGap} weightPct={SCORE_WEIGHTS.orderbookGap * 100} />
              <FactorBar label="Fleet Size" value={opportunity.factors.fleetSize} weightPct={SCORE_WEIGHTS.fleetSize * 100} />
              <FactorBar label="Fleet Growth" value={opportunity.factors.fleetGrowth} weightPct={SCORE_WEIGHTS.fleetGrowth * 100} />
              <FactorBar label="Fuel Transition" value={opportunity.factors.fuelTransition} weightPct={SCORE_WEIGHTS.fuelTransition * 100} />
              <FactorBar label="Market Condition" value={opportunity.factors.marketCondition} weightPct={SCORE_WEIGHTS.marketCondition * 100} />
            </div>
            <p className="mt-4 border-t border-border pt-3 text-[11px] text-muted">
              Rules calculate the score. AI only explains it below — it never determines or alters
              the numerical result.
            </p>
          </Card>

          <Card>
            <span className="inline-block rounded border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-medium tracking-wide text-accent">
              AI COMMERCIAL INSIGHT · DEMO
            </span>
            <p className="mt-3 text-sm leading-relaxed text-foreground">{explanation}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {opportunity.signals.map((s) => (
                <span key={s} className="rounded border border-border bg-surface-2 px-2 py-0.5 text-[11px] text-muted">
                  {s}
                </span>
              ))}
            </div>
          </Card>

          <Card>
            <CardLabel>Recommended Action</CardLabel>
            <p className="mt-1.5 text-sm font-medium text-foreground">{scored.recommendedAction}</p>
          </Card>
        </div>

        <SalesBriefPanel opportunity={scored} signals={mockMarketSignals} />
      </div>
    </div>
  );
}
