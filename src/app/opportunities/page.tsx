import type { Metadata } from "next";
import Link from "next/link";
import { mockOpportunities } from "@/data/mockOpportunities";
import { scoreAllOpportunities } from "@/lib/scoring";
import { PageShell } from "@/components/shell/page-shell";
import { PageHeader } from "@/components/shell/page-header";
import { Card } from "@/components/ui/card";
import { Badge, DataBadge } from "@/components/ui/badge";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { ScoreBlock } from "@/components/opportunities/score-block";
import { ScoringAssumptions } from "@/components/opportunities/scoring-assumptions";

export const metadata: Metadata = {
  title: "조선 영업기회",
  description: "선주사를 선대·발주잔량·연료전환 지표로 점수화한 조선 영업 우선순위 (예시 데이터)",
};

// 열 정렬 (모바일은 카드로 쌓는다)
// lg: 순위 | 고객사(+시그널) | 선대 규모 | 평균 선령 | 발주잔량 | 점수
// xl: 순위 | 고객사 | 주요 시그널 | 선대 규모 | 평균 선령 | 발주잔량 | 점수 — 넓은 화면에서 행 높이를 줄인다
// 행 배치는 row-start/row-end(longhand)만 쓴다 — row-span-*은 grid-row 축약형이라 앞 단계의 row-start를 지운다.
const ROW_GRID =
  "lg:grid-cols-[2rem_minmax(0,1fr)_5.5rem_5.5rem_5.5rem_6rem] xl:grid-cols-[2rem_16rem_minmax(0,1fr)_5.5rem_5.5rem_5.5rem_6rem]";

export default function OpportunitiesPage() {
  const scored = scoreAllOpportunities(mockOpportunities);

  return (
    <PageShell>
      <PageHeader
        eyebrow="SHIPBUILDING"
        title="조선 영업기회"
        description="선주사를 선대·발주잔량·연료전환 지표로 점수화해 영업 우선순위를 정합니다. 고객사와 수치는 예시 데이터입니다."
        assumptionsTitle="점수 산정 방식"
        assumptions={<ScoringAssumptions />}
      />

      <section aria-labelledby="opp-list-title">
        <div className="mb-5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="opp-list-title" className="type-h2 text-fg">
              점수순 고객사
            </h2>
            <DataBadge grade="demo" />
          </div>
          <p className="mt-2 text-[0.8125rem] leading-relaxed text-fg-muted">
            예시 데이터 · 가상 고객사 <span className="num">{scored.length}</span>곳 · 고객사를 선택하면 점수 분해와
            영업 브리프를 봅니다
          </p>
        </div>

        <div
          aria-hidden="true"
          className={`hidden gap-x-6 border-b border-line px-5 pb-3 type-label text-fg-label lg:grid ${ROW_GRID}`}
        >
          <span className="num">#</span>
          <span>고객사</span>
          <span className="hidden xl:block">주요 시그널</span>
          <span className="text-right">선대 규모</span>
          <span className="text-right">평균 선령</span>
          <span className="text-right">발주잔량</span>
          <span className="text-center">점수</span>
        </div>

        <Stagger as="ul" className="space-y-3 lg:mt-3">
          {scored.map((o, i) => (
            <StaggerItem as="li" key={o.id}>
              {/* 카드 전체가 눌리지만 링크 이름은 고객사명뿐이다(stretched link). 포커스 링은 카드에 그린다. */}
              <Card
                interactive
                className={`relative grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-3 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-accent lg:gap-x-6 ${ROW_GRID}`}
              >
                <span
                  aria-hidden="true"
                  className="num hidden text-sm text-fg-muted lg:col-start-1 lg:row-start-1 lg:block lg:self-start xl:self-center"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>

                <div className="col-start-1 row-start-1 min-w-0 lg:col-start-2 xl:self-center">
                  <h3 className="text-[0.9375rem] font-semibold leading-snug text-fg">
                    <Link
                      href={`/opportunities/${o.id}`}
                      className="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none"
                    >
                      <span className="sr-only">{i + 1}위 </span>
                      {o.customer}
                    </Link>
                  </h3>
                  <p className="mt-1 text-[0.8125rem] text-fg-muted">
                    {o.country} · {o.segment}
                  </p>
                </div>

                {o.signals.length > 0 && (
                  <ul
                    aria-label="주요 시그널"
                    className="col-span-2 row-start-2 flex flex-wrap gap-2 lg:col-span-1 lg:col-start-2 xl:col-start-3 xl:row-start-1 xl:self-center"
                  >
                    {o.signals.slice(0, 3).map((sig) => (
                      <li key={sig}>
                        <Badge className="font-medium tracking-normal">{sig}</Badge>
                      </li>
                    ))}
                  </ul>
                )}

                <ScoreBlock
                  score={o.score}
                  tier={o.tier}
                  className="col-start-2 row-start-1 self-start lg:col-start-6 lg:row-end-3 lg:self-center lg:justify-self-center xl:col-start-7 xl:row-end-2"
                />

                <dl className="col-span-2 row-start-3 mt-1 grid grid-cols-3 gap-3 border-t border-line pt-4 lg:col-span-3 lg:col-start-3 lg:row-start-1 lg:row-end-3 lg:mt-0 lg:gap-6 lg:self-center lg:border-0 lg:pt-0 xl:col-start-4 xl:row-end-2">
                  <FleetStat label="선대 규모" value={o.fleetSize} unit="척" />
                  <FleetStat label="평균 선령" value={o.averageFleetAge.toFixed(1)} unit="년" />
                  <FleetStat label="발주잔량" value={o.orderbook} unit="척" />
                </dl>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      </section>
    </PageShell>
  );
}

function FleetStat({ label, value, unit }: { label: string; value: number | string; unit: string }) {
  return (
    <div className="min-w-0 lg:text-right">
      <dt className="type-label text-fg-label lg:sr-only">{label}</dt>
      <dd className="mt-2 text-fg lg:mt-0">
        <span className="num text-sm">{value}</span>
        <span className="ml-1 text-xs text-fg-muted">{unit}</span>
      </dd>
    </div>
  );
}
