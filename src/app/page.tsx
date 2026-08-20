import Link from "next/link";
import { ArrowUpRight, TrendingUp } from "lucide-react";
import { mockMarketIndicators, mockMarketSignals } from "@/data/mockMarket";
import { mockOpportunities } from "@/data/mockOpportunities";
import { scoreAllOpportunities, TIER_COLOR, TIER_LABEL_KO } from "@/lib/scoring";
import { KpiCard } from "@/components/kpi-card";
import { Card } from "@/components/ui/card";
import { cn, IMPORTANCE_LABEL_KO } from "@/lib/utils";

export default function HomePage() {
  const heroIndicators = mockMarketIndicators.slice(0, 4);
  const topSignals = mockMarketSignals.slice(0, 3);
  const topOpportunities = scoreAllOpportunities(mockOpportunities).slice(0, 3);

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="animate-fade-in-up">
        <p className="text-xs font-semibold tracking-[0.16em] text-accent">
          해양·조선 영업기획 대시보드
        </p>
        <h1 className="mt-2 max-w-2xl text-4xl font-bold leading-tight text-foreground sm:text-5xl">
          시장 인텔리전스 · 영업기회 스코어링 · 세일즈 브리프
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          선대·시황·선박 데이터 기반 영업기회 자동 채점, AI 브리프 생성. 전 모듈 실제 동작.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/opportunities"
            className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-xs font-semibold text-background transition-opacity hover:opacity-90"
          >
            영업기회
            <ArrowUpRight size={14} />
          </Link>
          <Link
            href="/market"
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-surface"
          >
            시황
          </Link>
        </div>
      </section>

      {/* KPI grid */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-wide text-foreground">시장 지표</h2>
          <Link href="/market" className="text-xs text-accent hover:underline">
            전체 시황 보기 →
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
          <h2 className="mb-3 text-sm font-semibold tracking-wide text-foreground">시장 시그널</h2>
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
                    {IMPORTANCE_LABEL_KO[s.importance]}
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
              상위 영업기회
            </h2>
            <Link href="/opportunities" className="text-xs text-accent hover:underline">
              전체 보기 →
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
                        {TIER_LABEL_KO[o.tier]}
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
