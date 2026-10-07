import { cn } from "@/lib/utils";

type VesselKind = "tanker" | "bulker" | "container" | "lng";

// 탱커를 먼저 본다: "MR 탱커 (LNG-Ready)"는 LNG 운반선이 아니라 탱커다.
function classify(vesselType: string): VesselKind {
  const t = vesselType.toLowerCase();
  if (t.includes("탱커") || t.includes("tanker")) return "tanker";
  if (t.includes("벌커") || t.includes("bulk")) return "bulker";
  if (t.includes("컨테이너") || t.includes("container")) return "container";
  if (t.includes("lng") || t.includes("lpg") || t.includes("가스") || t.includes("gas")) return "lng";
  return "tanker";
}

const DETAIL = "var(--line-strong)";

/** 선미 거주구(브리지·연돌) — 탱커·벌커·LNG 공통 */
function AftHouse() {
  return (
    <>
      <path d="M6.2 12 L6.8 7 H9.8 L9.4 12 Z" fill="currentColor" />
      <rect x="3.5" y="12" width="10.5" height="2" fill="currentColor" />
      <rect x="4.5" y="14" width="8.5" height="10" fill="currentColor" />
      <rect x="5.5" y="15.4" width="6.5" height="1.2" fill={DETAIL} />
    </>
  );
}

/**
 * 선종별 단색 측면 실루엣. 색이 아니라 형태로 선종을 구분한다
 * (탱커: 낮은 갑판·파이프 랙·매니폴드 크레인 / 벌커: 해치커버 열 / 컨테이너: 적재 블록 / LNG: 구형 탱크).
 * 몸체는 currentColor(기본 text-fg-muted), 세부선은 --line-strong.
 * 옆에 선종 텍스트가 있으면 decorative(기본)로 스크린리더에서 숨긴다.
 */
export function VesselIcon({
  vesselType,
  className,
  decorative = true,
}: {
  vesselType: string;
  className?: string;
  decorative?: boolean;
}) {
  const kind = classify(vesselType);

  return (
    <svg
      viewBox="0 0 64 36"
      className={cn("h-8 w-14 shrink-0 text-fg-muted", className)}
      {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": vesselType })}
    >
      {/* 수면 */}
      <path d="M0 29.5 H64" stroke={DETAIL} strokeWidth="1" />

      {kind === "tanker" && (
        <>
          <AftHouse />
          {/* 파이프 랙 */}
          <rect x="15" y="22.4" width="38" height="1.6" fill="currentColor" />
          {/* 매니폴드 크레인 */}
          <rect x="32.5" y="16.5" width="1.2" height="6" fill="currentColor" />
          <path d="M33.1 17 L40 19.6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          {/* 선수루 */}
          <rect x="53.5" y="21.5" width="5.5" height="2.5" fill="currentColor" />
        </>
      )}

      {kind === "bulker" && (
        <>
          <AftHouse />
          {/* 해치커버 6열 */}
          {[16, 22.2, 28.4, 34.6, 40.8, 47].map((x) => (
            <rect key={x} x={x} y="18.4" width="5" height="5.6" rx="0.8" fill="currentColor" />
          ))}
          <rect x="53.5" y="21.5" width="5.5" height="2.5" fill="currentColor" />
        </>
      )}

      {kind === "container" && (
        <>
          {/* 높은 거주구 */}
          <path d="M7 9 L7.6 4 H10.4 L10 9 Z" fill="currentColor" />
          <rect x="3.5" y="9" width="10" height="2" fill="currentColor" />
          <rect x="4.5" y="11" width="8" height="13" fill="currentColor" />
          <rect x="5.5" y="12.4" width="6" height="1.2" fill={DETAIL} />
          {/* 적재 블록 — 선수 쪽이 한 단 낮다 */}
          <path d="M15 24 V11 H51 V14 H56 V24 Z" fill="currentColor" />
          {[19.5, 24, 28.5, 33, 37.5, 42, 46.5, 51].map((x) => (
            <path key={x} d={`M${x} ${x < 51 ? 11 : 14} V24`} stroke={DETAIL} strokeWidth="0.8" />
          ))}
          <path d="M15 17.5 H56" stroke={DETAIL} strokeWidth="0.8" />
        </>
      )}

      {kind === "lng" && (
        <>
          <AftHouse />
          {/* 구형(Moss) 탱크 4기 — 갑판 위로 반 이상 솟는다 + 연결 트렁크 */}
          <rect x="15.5" y="22" width="42" height="2" fill="currentColor" />
          {[20.8, 31.6, 42.4, 53.2].map((cx) => (
            <circle key={cx} cx={cx} cy="22.4" r="5.2" fill="currentColor" />
          ))}
          {[20.8, 31.6, 42.4, 53.2].map((cx) => (
            <path key={`r${cx}`} d={`M${cx - 5} 21 H${cx + 5}`} stroke={DETAIL} strokeWidth="0.8" />
          ))}
        </>
      )}

      {/* 선체 */}
      <path d="M2 24 H58 L62 22.5 L59.5 31 H7 C4.5 31 3 29.5 2.6 27 Z" fill="currentColor" />
      <path d="M3.2 27.6 H60.5" stroke={DETAIL} strokeWidth="1" />
    </svg>
  );
}
