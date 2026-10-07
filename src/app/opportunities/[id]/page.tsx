import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { mockOpportunities } from "@/data/mockOpportunities";
import { mockMarketSignals } from "@/data/mockMarket";
import { explainScore, scoreOpportunity, SCORE_WEIGHTS } from "@/lib/scoring";
import { formatNum } from "@/lib/utils";
import { PageShell } from "@/components/shell/page-shell";
import { PageHeader } from "@/components/shell/page-header";
import { Card } from "@/components/ui/card";
import { Badge, DataBadge } from "@/components/ui/badge";
import { Stat } from "@/components/ui/stat";
import { Reveal } from "@/components/motion/reveal";
import { FactorBar, FACTOR_GRID } from "@/components/opportunities/factor-bar";
import { SalesBriefPanel } from "@/components/opportunities/sales-brief-panel";
import { ScoreBlock } from "@/components/opportunities/score-block";
import { ScoringAssumptions } from "@/components/opportunities/scoring-assumptions";
import { SCORE_FACTORS } from "@/components/opportunities/factors";
import { keepKoreanWords } from "@/components/opportunities/keep-words";

export const dynamicParams = false;

export function generateStaticParams() {
  return mockOpportunities.map((o) => ({ id: o.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const o = mockOpportunities.find((x) => x.id === id);
  return { title: o ? `${o.customer} · 조선 영업기회` : "조선 영업기회" };
}

export default async function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const opportunity = mockOpportunities.find((o) => o.id === id);
  if (!opportunity) notFound();

  const scored = scoreOpportunity(opportunity);
  const explanation = explainScore(opportunity, scored.score, scored.tier);

  return (
    <PageShell>
      <div className="pt-4 md:pt-8">
        <Link
          href="/opportunities"
          className="-ml-2 inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm text-fg-muted transition-colors hover:text-fg md:min-h-9"
        >
          <ArrowLeft size={15} strokeWidth={1.75} aria-hidden="true" />
          조선 영업기회
        </Link>
      </div>

      <PageHeader
        className="pt-2 md:pt-4"
        eyebrow="SHIPBUILDING"
        title={opportunity.customer}
        description={`${opportunity.country} · ${opportunity.segment} · 예시 데이터`}
        assumptionsTitle="점수 산정 방식"
        assumptions={<ScoringAssumptions />}
        actions={
          // 좁은 화면에서는 배지를 점수 위로 올려 ? 버튼과 한 줄에 들어가게 한다
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
            <DataBadge grade="demo" />
            <ScoreBlock score={scored.score} tier={scored.tier} size="lg" />
          </div>
        }
      />

      <section aria-labelledby="fleet-title">
        <div className="mb-4 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="fleet-title" className="type-h2 text-fg">
              선대 지표
            </h2>
            <DataBadge grade="demo" />
          </div>
          <p className="mt-2 text-[0.8125rem] leading-relaxed text-fg-muted">예시 데이터 · 가상 고객사</p>
        </div>
        <Card className="grid grid-cols-2 gap-x-6 gap-y-6 md:grid-cols-4 md:gap-0 md:divide-x md:divide-line md:p-0">
          <Stat
            className="md:p-5"
            label="선대 규모"
            value={opportunity.fleetSize}
            unit="척"
            hint={`성장률 ${formatNum(opportunity.fleetGrowthPct, { decimals: 1, suffix: "%", signed: true })}/년`}
          />
          <Stat className="md:p-5" label="평균 선령" value={opportunity.averageFleetAge} format={{ decimals: 1 }} unit="년" />
          <Stat className="md:p-5" label="발주잔량" value={opportunity.orderbook} unit="척" />
          <Stat className="md:p-5" label="연료전환 비율" value={opportunity.fuelTransitionPct} unit="%" />
        </Card>
      </section>

      <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="min-w-0 space-y-6 lg:col-span-7">
          <Reveal as="section">
            <Card>
              <div className="mb-5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-[0.9375rem] font-semibold leading-snug text-fg">점수 분해</h2>
                  <DataBadge grade="demo" />
                </div>
                <p className="mt-1 text-[0.8125rem] leading-relaxed text-fg-muted">
                  {keepKoreanWords("요인 점수(0–100) × 가중치의 합이 영업기회 점수입니다.")}
                </p>
              </div>

              <div
                aria-hidden="true"
                className={`mb-3 hidden gap-x-4 border-b border-line pb-3 type-label text-fg-label sm:grid ${FACTOR_GRID}`}
              >
                <span>요인 · 가중치</span>
                <span className="col-span-2">요인 점수 (0–100)</span>
                <span className="text-right">기여</span>
              </div>

              <ul className="space-y-4">
                {SCORE_FACTORS.map((f) => (
                  <FactorBar key={f.key} label={f.label} value={opportunity.factors[f.key]} weight={SCORE_WEIGHTS[f.key]} />
                ))}
              </ul>

              <div className="mt-5 flex items-baseline justify-between gap-4 border-t border-line pt-4">
                <span className="text-sm text-fg-muted">합계 (반올림)</span>
                <span className="text-fg">
                  <span className="num text-lg font-semibold">{scored.score}</span>
                  <span className="num text-sm text-fg-muted"> / 100</span>
                </span>
              </div>

              <p className="mt-4 rounded-lg bg-inset px-4 py-3 text-xs leading-relaxed text-fg-muted">
                {keepKoreanWords(
                  "점수는 규칙(가중합 수식)이 계산합니다. 해설과 영업 브리프 문장은 템플릿이 만들며, AI를 연결해도 결과를 설명할 뿐 점수를 정하거나 바꾸지 않습니다."
                )}
              </p>
            </Card>
          </Reveal>

          <Reveal as="section">
            <Card>
              <div className="mb-4 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-[0.9375rem] font-semibold leading-snug text-fg">점수 해설</h2>
                  <Badge>템플릿 생성</Badge>
                  <DataBadge grade="demo" />
                </div>
                <p className="mt-1 text-[0.8125rem] leading-relaxed text-fg-muted">
                  결정론적 템플릿 문장 · 같은 입력이면 같은 문장
                </p>
              </div>
              <p className="type-body text-fg">{keepKoreanWords(explanation)}</p>

              <ul aria-label="고객 시그널" className="mt-4 flex flex-wrap gap-2">
                {opportunity.signals.map((s) => (
                  <li key={s}>
                    <Badge className="font-medium tracking-normal">{s}</Badge>
                  </li>
                ))}
              </ul>

              <div className="mt-5 rounded-lg border border-accent/30 bg-accent/10 p-4">
                <h3 className="type-label text-accent-text">추천 액션</h3>
                <p className="mt-2 flex gap-2 text-sm font-medium leading-relaxed text-fg">
                  <ArrowRight size={16} strokeWidth={1.75} className="mt-[3px] shrink-0 text-accent" aria-hidden="true" />
                  {keepKoreanWords(scored.recommendedAction)}
                </p>
              </div>
            </Card>
          </Reveal>
        </div>

        <div className="min-w-0 lg:col-span-5">
          <SalesBriefPanel opportunity={scored} signals={mockMarketSignals} className="lg:sticky lg:top-24" />
        </div>
      </div>
    </PageShell>
  );
}
