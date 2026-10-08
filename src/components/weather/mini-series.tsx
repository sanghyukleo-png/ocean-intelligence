import { cn } from "@/lib/utils";

/**
 * 72시간 미니 곡선(축 없음, 서버 렌더 SVG). 임계값을 점선으로, 넘는 구간은 warn 색 막대로 표시한다.
 * 값은 옆 숫자와 aria-label로도 전달한다 — 그림만으로 정보를 주지 않는다.
 */
export function MiniSeries({
  values,
  threshold,
  label,
  unit,
  className,
}: {
  values: (number | null)[];
  threshold: number;
  label: string;
  unit: string;
  className?: string;
}) {
  const W = 144;
  const H = 32;
  const nums = values.filter((v): v is number => v !== null);
  if (nums.length < 2) return <span className="text-xs text-fg-faint">—</span>;
  const top = Math.max(threshold * 1.15, ...nums);
  const x = (i: number) => (i / Math.max(1, values.length - 1)) * W;
  const y = (v: number) => H - 2 - (v / top) * (H - 4);
  const path = values.map((v, i) => (v === null ? null : `${x(i).toFixed(1)},${y(v).toFixed(1)}`)).filter(Boolean).join(" ");
  const over = values.map((v, i) => (v !== null && v >= threshold ? i : -1)).filter((i) => i >= 0);
  const peak = Math.max(...nums);
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      role="img"
      aria-label={`${label} 72시간: 최대 ${peak.toFixed(1)}${unit}, 기준 ${threshold}${unit} 이상 ${over.length}시간`}
      className={cn("block shrink-0 overflow-visible", className)}
    >
      {over.map((i) => (
        <rect key={i} x={x(i) - W / values.length / 2} y={0} width={W / values.length} height={H} className="fill-warn/20" />
      ))}
      <line x1={0} x2={W} y1={y(threshold)} y2={y(threshold)} className="stroke-warn" strokeWidth={1} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
      <polyline points={path} fill="none" className="stroke-fg-muted" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
      {/* 24h·48h 구분선 */}
      {[24, 48].map((h) => (
        <line key={h} x1={x(h)} x2={x(h)} y1={0} y2={H} className="stroke-line" strokeWidth={1} vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}
