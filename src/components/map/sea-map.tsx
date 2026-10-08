"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import type { Map as MlMap, StyleSpecification } from "maplibre-gl";
import { buildBaseStyle } from "@/lib/map/style";
import { cn } from "@/lib/utils";

// 공용 지도(지시서 12.1) — MapLibre GL은 이 컴포넌트가 화면에 올 때만 동적 import(초기 번들 제외).
// 특보 지도·AIS·항로 맵(Phase 5)이 같은 컴포넌트를 쓴다. 테마가 바뀌면 토큰을 다시 읽어 스타일을 교체한다.

export interface MapPoint {
  id: string;
  lon: number;
  lat: number;
  label: string;
  /** 점 색 CSS 토큰 (예: "--risk-3") */
  colorToken: string;
  /** 값 없음(미수집) 표시 — 속이 빈 점 */
  hollow?: boolean;
}

export interface MapBox {
  id: string;
  /** [[남, 서], [북, 동]] 위경도 */
  box: [[number, number], [number, number]];
  label: string;
}

function css(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function buildStyle(points: MapPoint[], boxes: MapBox[]): StyleSpecification {
  const base = buildBaseStyle({ sea: css("--map-sea"), land: css("--map-land"), coast: css("--map-coast"), label: css("--map-label"), boundary: css("--line-strong") });
  const fg = css("--fg");
  const bg = css("--bg");
  const label = css("--map-label");
  base.sources.points = {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: points.map((p) => ({
        type: "Feature",
        id: p.id,
        properties: { label: p.label, color: css(p.colorToken) || label, hollow: p.hollow ? 1 : 0 },
        geometry: { type: "Point", coordinates: [p.lon, p.lat] },
      })),
    },
  };
  base.sources.boxes = {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: boxes.map((b) => {
        const [[s, w], [n, e]] = b.box;
        return {
          type: "Feature",
          id: b.id,
          properties: { label: b.label },
          geometry: { type: "Polygon", coordinates: [[[w, s], [e, s], [e, n], [w, n], [w, s]]] },
        };
      }),
    },
  };
  base.layers.push(
    { id: "boxes-line", type: "line", source: "boxes", paint: { "line-color": css("--accent"), "line-width": 1, "line-dasharray": [2, 2] } },
    {
      id: "boxes-label",
      type: "symbol",
      source: "boxes",
      layout: { "text-field": ["get", "label"], "text-font": ["Noto Sans Regular"], "text-size": 11, "text-anchor": "bottom-left", "text-offset": [0.2, -0.2] },
      paint: { "text-color": label, "text-halo-color": bg, "text-halo-width": 1 },
    },
    {
      id: "points",
      type: "circle",
      source: "points",
      paint: {
        "circle-radius": 6,
        "circle-color": ["case", ["==", ["get", "hollow"], 1], bg, ["get", "color"]],
        "circle-stroke-color": ["case", ["==", ["get", "hollow"], 1], label, bg],
        "circle-stroke-width": 1.5,
      },
    },
    {
      id: "points-label",
      type: "symbol",
      source: "points",
      layout: { "text-field": ["get", "label"], "text-font": ["Noto Sans Regular"], "text-size": 12, "text-anchor": "left", "text-offset": [0.9, 0], "text-optional": true },
      paint: { "text-color": fg, "text-halo-color": bg, "text-halo-width": 1.2 },
    }
  );
  return base;
}

export function SeaMap({
  points = [],
  boxes = [],
  center,
  zoom,
  ariaLabel,
  className,
}: {
  points?: MapPoint[];
  boxes?: MapBox[];
  center: [number, number];
  zoom: number;
  ariaLabel: string;
  className?: string;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<MlMap | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  // 테마 전환 콜백이 최신 점·상자를 쓰도록(렌더 중 ref 갱신 금지 → 효과에서)
  const overlays = useRef({ points, boxes });
  useEffect(() => {
    overlays.current = { points, boxes };
  }, [points, boxes]);

  useEffect(() => {
    let cancelled = false;
    let cleanup = () => {};
    import("maplibre-gl")
      .then(({ Map, AttributionControl, NavigationControl, getVersion, setWorkerUrl }) => {
        if (cancelled || !el.current) return;
        // 워커는 scripts/copy-maplibre-worker.mjs가 public/에 복사한 같은 버전 파일
        setWorkerUrl(`/vendor/maplibre-gl/${getVersion()}/maplibre-gl-worker.mjs`);
        const m = new Map({
          container: el.current,
          style: buildStyle(overlays.current.points, overlays.current.boxes),
          center,
          zoom,
          attributionControl: false,
          // 페이지 스크롤을 가로채지 않는다 — 확대는 Ctrl/⌘+휠, 모바일은 두 손가락
          cooperativeGestures: true,
          localIdeographFontFamily: "'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR', sans-serif",
          renderWorldCopies: true,
        });
        m.addControl(new AttributionControl({ compact: true }), "bottom-right");
        m.addControl(new NavigationControl({ showCompass: false }), "top-right");
        m.on("load", () => !cancelled && setState("ready"));
        m.on("error", (e) => console.warn("[map]", e.error?.message ?? e));
        map.current = m;
        // 시각 검증 스크립트(.reports/qa-tools/map-check.mjs)가 타일 로드 완료를 기다릴 수 있게 개발 중에만 노출
        if (process.env.NODE_ENV !== "production") (window as unknown as { __oiMapDebug?: MlMap }).__oiMapDebug = m;

        // 테마 전환: data-theme 속성 또는 시스템 설정 변경 시 토큰을 다시 읽는다
        const restyle = () => requestAnimationFrame(() => m.setStyle(buildStyle(overlays.current.points, overlays.current.boxes)));
        const mo = new MutationObserver(restyle);
        mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        mq.addEventListener("change", restyle);
        cleanup = () => {
          mo.disconnect();
          mq.removeEventListener("change", restyle);
          m.remove();
        };
      })
      .catch((e) => {
        console.warn("[map] 초기화 실패", e);
        if (!cancelled) setState("error");
      });
    return () => {
      cancelled = true;
      cleanup();
      map.current = null;
    };
    // center·zoom은 첫 화면 값 — 이후 변경은 사용자 조작을 존중한다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 점·상자 데이터만 바뀌면 스타일 전체 대신 소스만 갱신
  useEffect(() => {
    const m = map.current;
    if (!m || state !== "ready") return;
    m.setStyle(buildStyle(points, boxes));
  }, [points, boxes, state]);

  return (
    <div className={cn("oi-map relative overflow-hidden rounded-xl border border-line bg-[var(--map-sea)]", className)}>
      {/* maplibre-gl.css가 .maplibregl-map에 position:relative를 주므로 absolute 대신 크기로 채운다 */}
      <div ref={el} role="region" aria-label={ariaLabel} className="h-full w-full" />
      {state !== "ready" && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-fg-muted">
          {state === "loading" ? <span aria-hidden="true" className="oi-skeleton h-full w-full rounded-none" /> : "지도를 표시할 수 없습니다(WebGL 미지원 또는 타일 서버 응답 없음)"}
        </div>
      )}
    </div>
  );
}
