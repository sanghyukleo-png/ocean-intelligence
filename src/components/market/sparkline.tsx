"use client";

import { useEffect, useRef, useState } from "react";
import { cn, formatNum, type NumFormat } from "@/lib/utils";

// 플롯 높이 중 위·아래 여백(%) — 선과 끝점이 가장자리에 닿지 않게
const PAD_Y = 14;
// 터치는 손을 뗀 뒤 이 시간만큼 툴팁 유지
const TOUCH_HOLD_MS = 1800;

/**
 * 스탯 타일용 스파크라인(축·격자 없음).
 * 선은 비강조색(--fg-faint), 마지막 시점만 accent 점. 호버/탭하면 세로 보조선 + 값 툴팁.
 * 키보드: 포커스하면 최근 시점, ←/→·Home/End로 이동, Esc로 닫기(호버와 같은 정보).
 * 스크린리더는 aria-label로 모든 시점 값을 읽는다 — 툴팁은 보조일 뿐 값을 가두지 않는다.
 * SVG는 preserveAspectRatio="none"으로 폭에 맞춰 늘이고(측정 없이 SSR 일치),
 * 선 두께는 non-scaling-stroke로 2px 고정, 점·툴팁은 같은 % 좌표의 HTML 요소로 그린다.
 */
export function Sparkline({
  data,
  label,
  format,
  unit,
  className,
}: {
  data: number[];
  /** 스크린리더 설명에 쓰는 지표 이름 */
  label: string;
  format?: NumFormat;
  unit?: string;
  className?: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef(0);

  useEffect(() => () => window.clearTimeout(hideTimer.current), []);

  const n = data.length;
  if (n < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const pts = data.map((v, i) => ({
    x: (i / (n - 1)) * 100,
    y: max === min ? 50 : PAD_Y + (1 - (v - min) / (max - min)) * (100 - 2 * PAD_Y),
  }));
  const path = pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ");
  const last = pts[n - 1];
  const fmt = (v: number) => `${formatNum(v, format)}${unit ? ` ${unit}` : ""}`;
  const summary = `${label} 예시 추이, ${n}개 시점${unit ? `, 단위 ${unit}` : ""}: ${data
    .map((v) => formatNum(v, format))
    .join(", ")}`;

  function indexAt(clientX: number) {
    const box = plotRef.current?.getBoundingClientRect();
    if (!box || box.width === 0) return null;
    const t = (clientX - box.left) / box.width;
    return Math.max(0, Math.min(n - 1, Math.round(t * (n - 1))));
  }

  function show(e: React.PointerEvent) {
    window.clearTimeout(hideTimer.current);
    setActive(indexAt(e.clientX));
  }

  function hide() {
    window.clearTimeout(hideTimer.current);
    setActive(null);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") return hide();
    const cur = active ?? n - 1;
    const next =
      e.key === "ArrowLeft"
        ? cur - 1
        : e.key === "ArrowRight"
          ? cur + 1
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? n - 1
              : null;
    if (next === null) return;
    e.preventDefault();
    window.clearTimeout(hideTimer.current);
    setActive(Math.max(0, Math.min(n - 1, next)));
  }

  const a = active === null ? null : pts[active];
  // 툴팁은 보조선 옆(왼쪽 절반이면 오른쪽, 오른쪽 절반이면 왼쪽)에 세로 중앙으로 — 위쪽 큰 숫자를 가리지 않는다
  const tipShift = a === null ? "" : a.x > 50 ? "translate(calc(-100% - 8px), -50%)" : "translate(8px, -50%)";

  return (
    // 포인터 영역은 바깥 상자 전체 — 플롯 좌우 4px 여백(끝점의 바깥 절반)도 맨 앞·맨 끝 시점으로 잡힌다.
    // 탭으로 값을 보는 요소라 모바일은 높이 44px(터치 타깃 최소, 지시서 3.5), md 이상 40px. 플롯은 inset-y-0이라 함께 늘어난다
    <div
      role="img"
      aria-label={summary}
      tabIndex={0}
      className={cn("relative h-11 touch-pan-y md:h-10", className)}
      // 포인터로 이미 시점을 고른 상태면 유지, 키보드 진입이면 최근 시점부터
      onFocus={() => setActive((cur) => cur ?? n - 1)}
      onBlur={hide}
      onKeyDown={onKeyDown}
      onPointerDown={show}
      onPointerMove={show}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") hide();
      }}
      onPointerUp={(e) => {
        if (e.pointerType !== "mouse") hideTimer.current = window.setTimeout(() => setActive(null), TOUCH_HOLD_MS);
      }}
      // 세로 스크롤로 넘어가면 브라우저가 포인터를 취소한다 → 툴팁이 남지 않게
      onPointerCancel={hide}
    >
      <div ref={plotRef} className="absolute inset-y-0 left-1 right-1">
        <svg
          aria-hidden="true"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full overflow-visible"
        >
          <path
            d={path}
            fill="none"
            stroke="var(--fg-faint)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {a && <span aria-hidden="true" className="absolute inset-y-0 w-px bg-line-strong" style={{ left: `${a.x}%` }} />}

        <span
          aria-hidden="true"
          className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent ring-2 ring-raised"
          style={{ left: `${last.x}%`, top: `${last.y}%` }}
        />
        {a && active !== n - 1 && (
          <span
            aria-hidden="true"
            className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fg ring-2 ring-raised"
            style={{ left: `${a.x}%`, top: `${a.y}%` }}
          />
        )}

        {a && active !== null && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 z-10 whitespace-nowrap rounded-lg border border-line-strong bg-raised px-3 py-2 text-xs leading-5 shadow-[0_8px_24px_rgb(0_0_0/0.28)]"
            style={{ left: `${a.x}%`, transform: tipShift }}
          >
            <span className="block text-fg-muted">{active === n - 1 ? "최근 시점" : `시점 ${active + 1} / ${n}`}</span>
            <span className="num block font-medium text-fg">{fmt(data[active])}</span>
          </div>
        )}
      </div>
    </div>
  );
}
