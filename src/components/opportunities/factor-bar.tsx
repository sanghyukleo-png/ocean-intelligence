import { formatNum } from "@/lib/utils";

/** 머리 행과 요인 행이 같은 열을 쓰도록 공유한다: 라벨·가중치 | 막대 | 요인 점수 | 점수 기여 */
export const FACTOR_GRID = "sm:grid-cols-[10rem_minmax(0,1fr)_2.5rem_4rem]";

/**
 * 요인 미터 한 줄. 막대 채움은 accent, 트랙은 같은 색 15%(color-mix).
 * 요인 점수와 가중치·기여는 항상 글자로도 표기한다(막대만으로 전달하지 않는다).
 * 모바일: 라벨·값 한 줄 + 막대 한 줄 / sm 이상: 한 줄 4칸.
 */
export function FactorBar({
  label,
  value,
  weight,
}: {
  label: string;
  /** 요인 점수 0–100 */
  value: number;
  /** 가중치 0–1 */
  weight: number;
}) {
  const pct = Math.min(100, Math.max(0, value));
  const contribution = value * weight;
  const weightPct = Math.round(weight * 100);

  return (
    <li className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 ${FACTOR_GRID}`}>
      <p className="flex min-w-0 flex-wrap items-baseline gap-x-2">
        <span className="text-sm text-fg">{label}</span>
        <span className="whitespace-nowrap text-xs text-fg-muted">
          <span className="sr-only">, </span>가중치 <span className="num">{weightPct}%</span>
        </span>
      </p>

      <div
        aria-hidden="true"
        className="col-span-2 row-start-2 h-1.5 overflow-hidden rounded-full bg-accent/15 sm:col-span-1 sm:col-start-2 sm:row-start-1"
      >
        <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </div>

      <p className="flex items-baseline justify-end gap-3 sm:contents">
        <span className="num text-right text-sm text-fg">
          <span className="sr-only">요인 점수 </span>
          {value}
        </span>
        <span className="num whitespace-nowrap text-right text-xs text-fg-muted">
          <span className="sr-only">, 점수 기여 </span>
          {formatNum(contribution, { decimals: 1, signed: true })}점
        </span>
      </p>
    </li>
  );
}
