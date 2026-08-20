import Link from "next/link";
import { ArrowUpRight, TrendingUp } from "lucide-react";
import { mockMarketIndicators, mockMarketSignals } from "@/data/mockMarket";
import { mockOpportunities } from "@/data/mockOpportunities";
import { scoreAllOpportunities, TIER_COLOR } from "@/lib/scoring";
import { KpiCard } from "@/components/kpi-card";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const heroIndicators = mockMarketIndicators.slice(0, 4);
  const topSignals = mockMarketSignals.slice(0, 3);
  const topOpportunities = scoreAllOpportunities(mockOpportunities).slice(0, 3);

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="animate-fade-in-up">
        <p className="text-xs font-medium tracking-[0.16em] text-accent">
          MARITIME COMMAND DASHBOARD
        </p>
        <h1 className="mt-2 max-w-2xl text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
          Market signal to sales action — in one workflow.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          OCEAN INTELLIGENCE turns fleet, market, and vessel data into ranked commercial
          opportunities and AI-assisted sales briefs for merchant shipbuilding sales planning.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/opportunities"
            className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-xs font-semibold text-background transition-opacity hover:opacity-90"
          >
            View Sales Opportunities
            <ArrowUpRight size={14} />
          </Link>
          <Link
            href="/market"
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-surface"
          >
            Explore Market Intelligence
          </Link>
        </div>
      </section>

      {/* KPI grid */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-wide text-foreground">Market Indicators</h2>
          <Link href="/market" className="text-xs text-accent hover:underline">
            Full market view →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {heroIndicators.map((ind) => (
            <KpiCard key={ind.id} indicator={ind} />
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        {/* Market signals */}
        <section className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold tracking-wide text-foreground">Market Signals</h2>
          <div className="space-y-3">
            {topSignals.map((s) => (
              <Card key={s.id} className="animate-fade-in-up">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <TrendingUp size={14} className="text-accent" />
                    {s.title}
                  </span>
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                      s.importance === "high"
                        ? "border-warning/40 bg-warning/10 text-warning"
                        : "border-border bg-surface-2 text-muted"
                    )}
                  >
                    {s.importance}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted">{s.summary}</p>
                <p className="mt-2 text-[11px] font-mono-num text-muted">{s.segment}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Opportunities summary */}
        <section className="lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wide text-foreground">
              Top Sales Opportunities
            </h2>
            <Link href="/opportunities" className="text-xs text-accent hover:underline">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {topOpportunities.map((o) => (
              <Link href={`/opportunities/${o.id}`} key={o.id}>
                <Card className="animate-fade-in-up cursor-pointer hover:border-accent/40">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{o.customer}</p>
                      <p className="text-xs text-muted">
                        {o.country} · {o.segment}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-wide",
                          TIER_COLOR[o.tier]
                        )}
                      >
                        {o.tier}
                      </span>
                      <span className="font-mono-num text-lg font-semibold text-foreground">
                        {o.score}
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
