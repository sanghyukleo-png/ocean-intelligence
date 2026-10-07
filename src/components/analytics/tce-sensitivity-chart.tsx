"use client";

import { useReducedMotion } from "motion/react";
import { CartesianGrid, Line, LineChart, ReferenceLine, Tooltip, XAxis, YAxis, type TooltipContentProps } from "recharts";
import { formatNum } from "@/lib/utils";

export interface SensitivityPoint {
  /** 벙커 가격 변동률 (−40 … +40) */
  pct: number;
  /** 그 변동률을 적용한 벙커 가격 $/MT */
  price: number;
  /** TCE $/day */
  tce: number;
}

/** 축 글자: 텍스트 토큰(--fg-muted), 12px 이상 (지시서 3.1: muted는 12px 미만 금지) */
const AXIS_TICK = { fill: "var(--fg-muted)", fontSize: 12, fontFamily: "var(--font-mono)" } as const;

/** 점 표식: 채움 8px + 카드 표면색 2px 링 (r=5, 선 폭 2 → 안쪽 4px까지 채움) */
const DOT = { r: 5, fill: "var(--accent)", stroke: "var(--bg-raised)", strokeWidth: 2 } as const;

/** −40 → "−40%", 0 → "0%", 20 → "+20%" */
export function formatPct(pct: number) {
  return formatNum(pct, { suffix: "%", signed: true });
}

/**
 * 값이 모두 같을 때(일일 소모 0 → 벙커 가격 영향 없음) 자동 축은 87,046…87,050처럼 1 단위로 확대돼
 * 없는 변동을 암시한다. 이때만 값의 자릿수 단위로 위아래 한 칸씩 둔 고정 눈금을 쓴다.
 */
function flatAxis(values: number[]) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const mid = (min + max) / 2;
  if (max - min > Math.max(1e-6, Math.abs(mid) * 1e-9)) return null;
  const step = Math.abs(mid) >= 10 ? 10 ** Math.floor(Math.log10(Math.abs(mid))) : 10;
  const lo = Math.floor(mid / step - 1) * step;
  const hi = Math.ceil(mid / step + 1) * step;
  const ticks: number[] = [];
  for (let t = lo; t <= hi; t += step) ticks.push(t);
  return { domain: [lo, hi] as [number, number], ticks };
}

function ChartTooltip({ active, payload }: Pick<TooltipContentProps, "active" | "payload">) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as SensitivityPoint;
  return (
    <div className="rounded-lg border border-line-strong bg-raised px-3 py-2 text-xs leading-5">
      <p className="text-fg-muted">
        벙커 {p.pct === 0 ? "현재" : formatPct(p.pct)} · <span className="num">{formatNum(p.price, { prefix: "$" })}/MT</span>
      </p>
      <p className="mt-1 flex items-center gap-2">
        <span aria-hidden="true" className="h-0.5 w-3 rounded-full bg-accent" />
        <span>
          <span className="num text-sm font-semibold text-fg">{formatNum(p.tce, { prefix: "$" })}</span>
          <span className="ml-1 text-fg-muted">/day</span>
        </span>
      </p>
    </div>
  );
}

/**
 * 벙커 가격 ±40% 민감도 — 단일 계열(범례 없음, 카드 제목이 계열 이름).
 * 2px 선 · 둥근 끝 · 가로 헤어라인 실선 그리드 · 크로스헤어 툴팁 · 현재(0%) 점만 강조.
 * 값은 표 보기(부모 카드)에서도 읽을 수 있다 — 툴팁은 보조.
 */
export function TceSensitivityChart({ data, height = 240 }: { data: SensitivityPoint[]; height?: number }) {
  const reduceMotion = useReducedMotion();
  const values = data.map((d) => d.tce);
  const crossesZero = Math.min(...values) < 0 && Math.max(...values) > 0;
  const flat = flatAxis(values);
  const current = data.find((d) => d.pct === 0);
  const first = data[0];
  const last = data[data.length - 1];

  return (
    <div
      role="img"
      // recharts 내부 g(tabindex=-1)가 터치로 포커스되면 브라우저 기본 외곽선이 그려진다 — 키보드로는 닿지 않으므로 숨긴다
      className="[&_:focus]:outline-none"
      aria-label={
        current && first && last
          ? `벙커 가격을 −40%에서 +40%까지 바꾸면 TCE는 ${formatNum(first.tce, { prefix: "$" })}에서 ${formatNum(last.tce, {
              prefix: "$",
            })}/day로 변합니다. 현재 벙커 가격에서는 ${formatNum(current.tce, { prefix: "$" })}/day.`
          : "벙커 가격 민감도 그래프"
      }
    >
      <LineChart
        responsive
        data={data}
        style={{ width: "100%", height }}
        margin={{ top: 20, right: 20, bottom: 4, left: 4 }}
        accessibilityLayer={false}
      >
        <CartesianGrid vertical={false} stroke="var(--line)" strokeWidth={1} />
        <XAxis
          dataKey="pct"
          type="number"
          domain={[-40, 40]}
          ticks={[-40, -20, 0, 20, 40]}
          tickFormatter={(v: number) => formatPct(v)}
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={{ stroke: "var(--line-strong)", strokeWidth: 1 }}
          tickMargin={8}
        />
        <YAxis
          domain={flat ? flat.domain : ["auto", "auto"]}
          ticks={flat?.ticks}
          tickFormatter={(v: number) => formatNum(v)}
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width="auto"
        />
        {crossesZero && <ReferenceLine y={0} stroke="var(--line-strong)" strokeWidth={1} />}
        <Tooltip
          content={(props) => <ChartTooltip {...props} />}
          cursor={{ stroke: "var(--line-strong)", strokeWidth: 1 }}
          isAnimationActive={false}
          offset={12}
        />
        <Line
          type="linear"
          dataKey="tce"
          stroke="var(--accent)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          isAnimationActive={!reduceMotion}
          animationDuration={480}
          animationEasing="ease-out"
          dot={(props) => {
            const { cx, cy, index, payload } = props;
            if ((payload as SensitivityPoint).pct !== 0 || cx == null || cy == null) {
              return <g key={`dot-${index}`} />;
            }
            return (
              <g key={`dot-${index}`}>
                <circle cx={cx} cy={cy} {...DOT} />
                <text x={cx + 10} y={cy - 10} fill="var(--fg-muted)" fontSize={12}>
                  현재
                </text>
              </g>
            );
          }}
          activeDot={DOT}
        />
      </LineChart>
    </div>
  );
}
