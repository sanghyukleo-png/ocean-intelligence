"use client";

import dynamic from "next/dynamic";
import type { MapPoint } from "@/components/map/sea-map";

// 지도는 클라이언트에서만 — MapLibre는 WebGL·window가 필요하다
const SeaMap = dynamic(() => import("@/components/map/sea-map").then((m) => m.SeaMap), {
  ssr: false,
  loading: () => <div aria-hidden="true" className="oi-skeleton h-full w-full rounded-xl" />,
});

// 크기는 바깥 상자가 정한다 — 지도 청크가 오기 전 자리표시자도 같은 높이라 레이아웃이 밀리지 않는다(CLS)
export function PortRiskMap({
  points,
  className,
  center = [127.8, 36.0],
  zoom = 5.4,
  ariaLabel = "국내 주요항 위치와 클로징 위험 등급 지도 — 같은 내용이 옆 표에 있습니다",
}: {
  points: MapPoint[];
  className?: string;
  center?: [number, number];
  zoom?: number;
  ariaLabel?: string;
}) {
  return (
    <div className={className}>
      <SeaMap points={points} center={center} zoom={zoom} ariaLabel={ariaLabel} className="h-full" />
    </div>
  );
}
