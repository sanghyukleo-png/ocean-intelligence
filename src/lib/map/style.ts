import type { StyleSpecification } from "maplibre-gl";

// 해도풍 MapLibre 스타일(지시서 12.1) — 육지 --map-land, 바다 --map-sea, 해안선·국경 얇게, 라벨 최소화.
// 베이스맵: OpenFreeMap 공개 인스턴스(OpenMapTiles 스키마 벡터 타일). 무료·무키·호출 한도 없음·상업 이용 가능,
//   출처 표기 의무(© OpenMapTiles, © OpenStreetMap contributors — TileJSON attribution을 MapLibre가 자동 표시).
//   SLA 없음(openfreemap.org, 2026-10-08 확인). 등심선은 OpenMapTiles에 없고, 별도 수심 데이터는 내려받기 승인 필요라 넣지 않는다.

export const BASEMAP = {
  tiles: "https://tiles.openfreemap.org/planet",
  glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
  font: ["Noto Sans Regular"],
  // 소스에 attribution을 주면 TileJSON 값을 덮어쓰므로 필수 표기를 모두 적는다
  attribution:
    '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> © <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
};

export interface MapColors {
  sea: string;
  land: string;
  coast: string;
  label: string;
  boundary: string;
}

export function buildBaseStyle(c: MapColors): StyleSpecification {
  // 라벨은 한국어 이름 우선 — 한글 글리프는 웹 글꼴 대신 브라우저 로컬 글꼴(localIdeographFontFamily)로 그린다
  const name = ["coalesce", ["get", "name:ko"], ["get", "name:en"], ["get", "name"]] as unknown as string;
  return {
    version: 8,
    glyphs: BASEMAP.glyphs,
    sources: {
      base: { type: "vector", url: BASEMAP.tiles, attribution: BASEMAP.attribution },
    },
    layers: [
      { id: "land", type: "background", paint: { "background-color": c.land } },
      { id: "sea", type: "fill", source: "base", "source-layer": "water", paint: { "fill-color": c.sea, "fill-antialias": true } },
      { id: "coast", type: "line", source: "base", "source-layer": "water", paint: { "line-color": c.coast, "line-width": 0.6 } },
      {
        id: "boundary",
        type: "line",
        source: "base",
        "source-layer": "boundary",
        filter: ["all", ["==", ["get", "admin_level"], 2], ["!=", ["get", "maritime"], 1]],
        paint: { "line-color": c.boundary, "line-width": 0.6, "line-dasharray": [3, 2] },
      },
      {
        id: "country-label",
        type: "symbol",
        source: "base",
        "source-layer": "place",
        filter: ["==", ["get", "class"], "country"],
        maxzoom: 6,
        layout: { "text-field": name, "text-font": BASEMAP.font, "text-size": 11, "text-letter-spacing": 0.08, "text-transform": "uppercase" },
        paint: { "text-color": c.label, "text-halo-color": c.land, "text-halo-width": 1 },
      },
      {
        id: "city-label",
        type: "symbol",
        source: "base",
        "source-layer": "place",
        filter: ["==", ["get", "class"], "city"],
        minzoom: 6,
        layout: { "text-field": name, "text-font": BASEMAP.font, "text-size": 11 },
        paint: { "text-color": c.label, "text-halo-color": c.land, "text-halo-width": 1 },
      },
    ],
  };
}
