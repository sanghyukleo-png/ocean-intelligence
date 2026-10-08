import { HERO_MAP } from "@/data/geo/hero-map";
import { cn } from "@/lib/utils";

// 히어로 비주얼(지시서 11.5): 장식용 항로 호 대신 실제 데이터 —
//   초크포인트의 지금 바람·파고(Open-Meteo 72시간 예보의 첫 시각). AIS 탱커 척수는 키가 생기면 같은 칩에 더한다.
// 데이터가 없으면 값 자리를 비운다. 가상 선박·움직이는 점·임의 항로 없음.

/** 히어로 칩 id → 해협 기상 */
export type GateNow = Record<string, { windKt: number | null; waveM: number | null }>;
const CHIP_TO_GATE: Record<string, string> = { hormuz: "hormuz", malacca: "singapore", "korea-strait": "korea-strait" };

function pct(v: number, total: number) {
  return `${(v / total) * 100}%`;
}

export function HeroMap({
  className,
  idPrefix = "hero-map",
  captionClassName,
  gates,
}: {
  /** 해협 지금 바람·파고 — 없으면 "—" */
  gates?: GateNow;
  className?: string;
  idPrefix?: string;
  /** 지도 아래 출처 캡션 (배경으로 깔리는 lg 이상에서는 숨기고 바깥에 따로 둔다) */
  captionClassName?: string;
}) {
  const { width, height, land, graticule, points } = HERO_MAP;
  const chokepoints = points.filter((p) => p.kind === "chokepoint");
  const ports = points.filter((p) => p.kind === "port");

  return (
    <figure className={cn("relative", className)} aria-labelledby={`${idPrefix}-caption`}>
      <figcaption id={`${idPrefix}-caption`} className="sr-only">
        중동–동북아 해역 지도. 호르무즈, 말라카·싱가포르, 대한해협의 지금 바람과 파고(모델 예보)를 표시합니다.
      </figcaption>
      <div className="relative w-full" style={{ aspectRatio: `${width} / ${height}` }}>
        <svg viewBox={`0 0 ${width} ${height}`} className="absolute inset-0 h-full w-full" aria-hidden="true">
          {/* 육지 경로는 한 번만 싣고 채움·해안선이 <use>로 재사용한다(HTML·RSC 페이로드 절감) */}
          <defs>
            <path id={`${idPrefix}-land`} d={land} pathLength={1} vectorEffect="non-scaling-stroke" />
          </defs>
          <path d={graticule} fill="none" stroke="var(--map-graticule)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
          <use href={`#${idPrefix}-land`} className="intro-land" fill="var(--map-land)" stroke="none" />
          <use
            href={`#${idPrefix}-land`}
            className="intro-draw"
            fill="none"
            stroke="var(--map-coast)"
            strokeWidth={1}
          />
        </svg>

        {/* 항구: 점 + mono 10px 라벨 (좁은 화면에서는 생략) */}
        {ports.map((p) => (
          <span
            key={p.id}
            aria-hidden="true"
            className="intro-fade pointer-events-none absolute hidden md:block"
            style={{ left: pct(p.x, width), top: pct(p.y, height), "--d": "880ms" } as React.CSSProperties}
          >
            <span className="absolute -left-[2.5px] -top-[2.5px] h-[5px] w-[5px] rounded-full bg-map-label" />
            <span
              className={cn(
                "absolute top-0 -translate-y-1/2 whitespace-nowrap font-mono text-[10px] tracking-wide text-map-label",
                p.side === "left" ? "right-2" : "left-2"
              )}
            >
              {p.label}
            </span>
          </span>
        ))}

        {/* 초크포인트: 링 + 지금 바람·파고 칩 */}
        {chokepoints.map((c, i) => {
          const g = gates?.[CHIP_TO_GATE[c.id]];
          return (
          <div
            key={c.id}
            className="intro-fade absolute"
            style={{ left: pct(c.x, width), top: pct(c.y, height), "--d": `${760 + i * 60}ms` } as React.CSSProperties}
          >
            <span aria-hidden="true" className="absolute -left-[7px] -top-[7px] h-[14px] w-[14px] rounded-full border-[1.5px] border-accent" />
            <span aria-hidden="true" className="absolute -left-[2px] -top-[2px] h-1 w-1 rounded-full bg-accent" />
            <div
              className={cn(
                "absolute top-3 w-max rounded-lg border border-line-strong bg-[color-mix(in_oklab,var(--bg-raised)_88%,transparent)] px-2 py-1 backdrop-blur-sm md:px-3 md:py-2",
                c.side === "left" ? "right-3" : "left-3"
              )}
            >
              <p className="font-mono text-[10px] tracking-wide text-fg-label">{c.label}</p>
              <p className="mt-1 flex items-center gap-2 text-[0.6875rem] md:text-xs">
                {g && g.windKt !== null ? (
                  <span className="num text-fg">
                    {Math.round(g.windKt)}kt{g.waveM !== null && ` · ${g.waveM.toFixed(1)}m`}
                  </span>
                ) : (
                  <>
                    <span className="text-fg-label">바람·파고</span>
                    <span className="num text-fg-faint">—</span>
                  </>
                )}
              </p>
            </div>
          </div>
          );
        })}
      </div>
      <HeroMapCaption className={cn("mt-2", captionClassName)} />
    </figure>
  );
}

export function HeroMapCaption({ className }: { className?: string }) {
  return (
    <p className={cn("text-[0.6875rem] text-fg-label", className)}>
      해안선 Natural Earth · 해협 바람·파고 Open-Meteo 모델 예보(지금 시각)
    </p>
  );
}
