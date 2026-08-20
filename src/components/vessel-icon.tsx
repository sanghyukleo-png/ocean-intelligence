import { cn } from "@/lib/utils";

function classify(vesselType: string): "tanker" | "bulker" | "container" | "lng" {
  if (vesselType.includes("LNG") || vesselType.includes("가스")) return "lng";
  if (vesselType.includes("벌커")) return "bulker";
  if (vesselType.includes("컨테이너")) return "container";
  return "tanker";
}

const HULL_FILL: Record<string, string> = {
  tanker: "#c2410c",
  bulker: "#0f766e",
  container: "#1d4ed8",
  lng: "#7c3aed",
};

// 선종별로 단순화된 벡터 실루엣입니다 (실제 선박 사진 대체용 데모 일러스트).
export function VesselIcon({ vesselType, className }: { vesselType: string; className?: string }) {
  const kind = classify(vesselType);
  const fill = HULL_FILL[kind];

  return (
    <svg viewBox="0 0 64 40" className={cn("h-8 w-14", className)} aria-label={vesselType}>
      <rect x="0" y="30" width="64" height="10" fill="var(--surface-2)" opacity="0.5" />
      {/* 선체 */}
      <path d="M4 28 L8 34 L56 34 L60 28 L58 18 L6 18 Z" fill={fill} />
      {kind === "container" ? (
        <>
          <rect x="10" y="9" width="10" height="9" fill={fill} opacity="0.85" />
          <rect x="21" y="9" width="10" height="9" fill={fill} opacity="0.65" />
          <rect x="32" y="9" width="10" height="9" fill={fill} opacity="0.85" />
          <rect x="43" y="9" width="10" height="9" fill={fill} opacity="0.65" />
        </>
      ) : kind === "lng" ? (
        <>
          <circle cx="20" cy="14" r="6" fill={fill} opacity="0.8" />
          <circle cx="34" cy="14" r="6" fill={fill} opacity="0.8" />
          <circle cx="48" cy="14" r="6" fill={fill} opacity="0.8" />
        </>
      ) : (
        <rect x="10" y="12" width="34" height="6" rx="1" fill={fill} opacity="0.6" />
      )}
      {/* 브릿지 */}
      <rect x="49" y="6" width="10" height="12" rx="1" fill="var(--foreground)" opacity="0.75" />
      {/* 수면선 */}
      <path d="M0 34 Q8 31 16 34 T32 34 T48 34 T64 34" stroke="var(--accent)" strokeWidth="1.5" fill="none" opacity="0.5" />
    </svg>
  );
}
