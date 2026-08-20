import { mockMarketIndicators, mockMarketSignals } from "@/data/mockMarket";
import { KpiCard } from "@/components/kpi-card";
import { Card } from "@/components/ui/card";
import { PageIntro } from "@/components/page-intro";
import { cn, IMPORTANCE_LABEL_KO } from "@/lib/utils";
import { ArrowDown, ArrowRight, ArrowUp, LineChart } from "lucide-react";

const DIRECTION_ICON = { up: ArrowUp, down: ArrowDown, flat: ArrowRight };

export default function MarketPage() {
  return (
    <div className="space-y-10">
      <PageIntro
        icon={LineChart}
        eyebrow="매크로 인텔리전스"
        title="시황"
        purpose="전 세계 상선대 규모, 평균 선령, 발주잔량, 신조 계약, 해체 실적, 대체연료 전환 비중, 종합 운임지수, 해상 물동량까지 8개 핵심 시장 지표와 주요 시장 시그널을 한 화면에서 확인합니다."
        howItWorks="모든 수치는 데모용 시뮬레이션 데이터(src/data/mockMarket.ts)이며, 화면은 이를 스파크라인·추세 배지로 그대로 시각화합니다. 실제 서비스에서는 이 자리에 실시간 시장 데이터 피드가 연결됩니다."
      />

      <section>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {mockMarketIndicators.map((ind) => (
            <KpiCard key={ind.id} indicator={ind} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold tracking-wide text-foreground">시장 시그널</h2>
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
                    {IMPORTANCE_LABEL_KO[s.importance]}
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
