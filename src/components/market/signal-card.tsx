import { ArrowDownRight, ArrowRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import type { MarketSignal, SignalImportance, TrendDirection } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IMPORTANCE_LABEL_KO } from "@/lib/utils";

/** 추세 방향 → 아이콘 + 한국어 라벨. 방향은 색이 아니라 아이콘·글자로 전달한다. */
const DIRECTION: Record<TrendDirection, { Icon: LucideIcon; label: string }> = {
  up: { Icon: ArrowUpRight, label: "상승" },
  down: { Icon: ArrowDownRight, label: "하락" },
  flat: { Icon: ArrowRight, label: "보합" },
};

const IMPORTANCE_TONE: Record<SignalImportance, "warn" | "info" | "neutral"> = {
  high: "warn",
  medium: "info",
  low: "neutral",
};

/** 시장 시그널 카드: 방향(아이콘+글자) · 중요도 배지 · 제목 · 요약 · 세그먼트 */
export function SignalCard({ signal }: { signal: MarketSignal }) {
  const { Icon, label: dirLabel } = DIRECTION[signal.direction];

  return (
    <Card className="flex h-full flex-col">
      <h3 className="text-[0.9375rem] font-semibold leading-snug text-fg">{signal.title}</h3>
      {/* 화면에서는 제목 위, DOM·스크린리더 순서는 제목 다음 — 제목으로 건너뛰어도 방향·중요도를 놓치지 않고,
          다음 카드의 메타가 앞 카드 끝처럼 들리지 않는다. 포커스 가능한 요소가 없어 탭 순서와 무관 */}
      <div className="order-first mb-4 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-xs font-medium text-fg-muted">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-inset text-fg">
            <Icon size={14} strokeWidth={2} aria-hidden="true" />
          </span>
          {dirLabel} 신호
        </span>
        <Badge tone={IMPORTANCE_TONE[signal.importance]} dot={signal.importance === "high"}>
          중요도 {IMPORTANCE_LABEL_KO[signal.importance]}
        </Badge>
      </div>
      <p className="mt-2 text-[0.8125rem] leading-relaxed text-fg-muted">{signal.summary}</p>
      <p className="mt-auto flex items-baseline gap-2 pt-4 text-xs">
        <span className="text-fg-muted">세그먼트</span>
        <span className="font-medium text-fg">{signal.segment}</span>
      </p>
    </Card>
  );
}
