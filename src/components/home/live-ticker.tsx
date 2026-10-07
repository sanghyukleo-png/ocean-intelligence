import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { DataBadge, provenanceLines } from "@/components/ui/badge";
import { AnimatedNumber } from "@/components/motion/animated-number";
import type { TickerItem } from "@/lib/market/ticker";
import { cn, formatNum } from "@/lib/utils";

/**
 * 헤더 바로 아래 36px 라이브 티커(지시서 4.1-2, 11.5). 넘치면 가로 스크롤 — 무한 마키 금지(9장).
 * 값이 없는 항목도 숨기지 않고 "—" + 상태 배지로 남긴다.
 */
export function LiveTicker({ items }: { items: TickerItem[] }) {
  return (
    <div
      className="intro-fade border-b border-line bg-[color-mix(in_oklab,var(--bg-raised)_70%,transparent)]"
      style={{ "--d": "700ms" } as React.CSSProperties}
    >
      <div className="container-page">
        {/* 좁은 화면에서는 가로 스크롤 — 키보드로도 스크롤할 수 있게 포커스를 받는다 */}
        <ul
          aria-label="주요 지표"
          tabIndex={0}
          className="relative -mx-1 flex h-10 items-center overflow-x-auto rounded-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((item, i) => {
            const dir = item.changePct === null || item.changePct === 0 ? null : item.changePct > 0 ? "up" : "down";
            const tone =
              dir === null || item.positiveIsGood === null
                ? "text-fg-muted"
                : (dir === "up") === item.positiveIsGood
                  ? "text-up"
                  : "text-down";
            return (
              <li
                key={item.key}
                title={provenanceLines(item.grade, item.provenance).join("\n") || undefined}
                className={cn("flex shrink-0 items-center gap-2 px-3 text-[0.8125rem]", i > 0 && "border-l border-line")}
              >
                <span className="whitespace-nowrap text-fg-muted">{item.label}</span>
                {item.value === null ? (
                  <span className="num text-fg-faint">
                    <span aria-hidden="true">—</span>
                    <span className="sr-only">값 없음</span>
                  </span>
                ) : (
                  <span className="num font-medium text-fg">
                    <AnimatedNumber value={item.value} from={0} delay={700} duration={600} {...item.format} />
                  </span>
                )}
                {item.changePct !== null && (
                  <span className={cn("num inline-flex items-center text-xs", tone)}>
                    {dir === "up" ? <ArrowUpRight size={12} aria-hidden="true" /> : dir === "down" ? <ArrowDownRight size={12} aria-hidden="true" /> : null}
                    {formatNum(item.changePct, { decimals: 2, suffix: "%", signed: true })}
                  </span>
                )}
                <DataBadge grade={item.grade} {...item.provenance} className="h-4 text-[0.625rem]" />
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
