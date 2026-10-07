import { TIER_COLOR, TIER_LABEL_KO } from "@/lib/scoring";
import { cn } from "@/lib/utils";
import type { OpportunityTier } from "@/types";

/**
 * 점수 + 등급. 등급은 색과 함께 항상 글자로 표기한다(색만으로 구분하지 않는다).
 * sm: 목록 행 · lg: 상세 머리
 */
export function ScoreBlock({
  score,
  tier,
  size = "sm",
  className,
}: {
  score: number;
  tier: OpportunityTier;
  size?: "sm" | "lg";
  className?: string;
}) {
  const label = TIER_LABEL_KO[tier];
  // 최상위 등급은 채움 배경(TIER_COLOR) — 그 위의 보조 글자는 잉크색을 그대로 물려받는다.
  // 나머지 등급은 틴트 배경이라 보조 글자를 중립 토큰으로 낮춘다.
  const solid = tier === "VERY HIGH";

  if (size === "lg") {
    return (
      <div className={cn("flex items-center gap-4 rounded-xl border px-5 py-3", TIER_COLOR[tier], className)}>
        <p className="flex items-baseline gap-1">
          <span className="sr-only">영업기회 점수</span>
          <span className="type-num-xl leading-none">{score}</span>
          <span className={cn("num text-sm", !solid && "text-fg-muted")}>/100</span>
        </p>
        <p className="border-l border-current/30 pl-4 text-left">
          <span className={cn("block type-label", !solid && "text-fg-label")}>등급</span>
          <span className="mt-2 block text-base font-semibold leading-none">{label}</span>
        </p>
      </div>
    );
  }
  return (
    <p className={cn("flex w-24 flex-col items-center justify-center rounded-lg border px-3 py-2", TIER_COLOR[tier], className)}>
      <span className="sr-only">점수</span>
      <span className="num text-[1.375rem] font-semibold leading-none tracking-tight">{score}</span>
      <span className="sr-only">점, 등급</span>
      <span className="mt-2 text-xs font-semibold leading-none">{label}</span>
    </p>
  );
}
