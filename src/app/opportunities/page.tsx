import Link from "next/link";
import { Target } from "lucide-react";
import { mockOpportunities } from "@/data/mockOpportunities";
import { scoreAllOpportunities, TIER_COLOR, TIER_LABEL_KO } from "@/lib/scoring";
import { Card, CardLabel } from "@/components/ui/card";
import { PageIntro } from "@/components/page-intro";
import { cn } from "@/lib/utils";

export default function OpportunitiesPage() {
  const scored = scoreAllOpportunities(mockOpportunities);

  return (
    <div className="space-y-8">
      <PageIntro
        icon={Target}
        eyebrow="영업기회 레이더"
        title="영업기회"
        purpose="후보 고객사(선사)를 규칙 기반 스코어링 엔진으로 0~100점 채점해 낮음/보통/높음/매우 높음 등급으로 자동 분류하고, 점수 순으로 정렬해 보여줍니다."
        howItWorks="점수는 선령·발주잔량 격차·선대 규모·선대 성장률·연료전환 비율·시장 상황 6개 요인에 가중치를 곱해 합산하는 결정론적 수식(src/lib/scoring.ts)만으로 계산됩니다. AI는 그 결과를 설명하고 다음 액션을 제안할 뿐, 점수를 직접 계산하거나 바꾸지 않습니다. 카드를 클릭하면 상세 분석과 AI 영업 브리프 생성 화면으로 이동합니다."
      />

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
                    <CardLabel>선대 규모</CardLabel>
                    <p className="font-mono-num text-sm text-foreground">{o.fleetSize}척</p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <CardLabel>평균 선령</CardLabel>
                    <p className="font-mono-num text-sm text-foreground">{o.averageFleetAge.toFixed(1)}년</p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <CardLabel>발주잔량</CardLabel>
                    <p className="font-mono-num text-sm text-foreground">{o.orderbook}척</p>
                  </div>
                  <div
                    className={cn(
                      "flex w-24 flex-col items-center rounded-md border px-3 py-2",
                      TIER_COLOR[o.tier]
                    )}
                  >
                    <span className="font-mono-num text-xl font-bold leading-none">{o.score}</span>
                    <span className="mt-1 text-[10px] font-semibold tracking-wide">{TIER_LABEL_KO[o.tier]}</span>
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
