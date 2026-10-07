// 홈 히어로 지도 SVG 경로를 빌드 시점에 미리 투영해 src/data/geo/hero-map.ts로 저장한다(런타임 JS 0).
// 해안선: Natural Earth 4.1.0 (public domain) via world-atlas (ISC). 실행: node scripts/build-hero-map.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { feature } from "topojson-client";
import { geoGraticule, geoMercator, geoPath } from "d3-geo";

const load = (name) => JSON.parse(readFileSync(new URL(`../node_modules/world-atlas/${name}`, import.meta.url)));

function build({ topo, bbox, width, step, points }) {
  const land = feature(topo, topo.objects.land);
  const [[w0, s0], [e0, n0]] = bbox;
  const frame = { type: "MultiPoint", coordinates: [[w0, s0], [e0, n0], [w0, n0], [e0, s0]] };
  const probe = geoMercator().fitWidth(width, frame);
  const [[, y0], [, y1]] = geoPath(probe).bounds(frame);
  const height = Math.round(y1 - y0);
  const projection = geoMercator().fitSize([width, height], frame).clipExtent([[0, 0], [width, height]]);
  const path = geoPath(projection).digits(1);
  const out = {
    width,
    height,
    land: path(land),
    graticule: step ? path(geoGraticule().step([step, step])()) : "",
    points: points.map((p) => {
      const [x, y] = projection([p.lon, p.lat]);
      return { ...p, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
    }),
  };
  return out;
}

// 표시용 근사 좌표(소수 1~2자리). 계산에 쓰는 항만 좌표는 Phase 2.5의 src/data/ports.ts에서 검증해 관리한다.
// side: 라벨·칩을 점의 어느 쪽에 둘지 (겹침 방지)
const MAIN_POINTS = [
  { id: "hormuz", label: "HORMUZ", kind: "chokepoint", side: "right", lon: 56.4, lat: 26.6 },
  { id: "malacca", label: "MALACCA · SINGAPORE", kind: "chokepoint", side: "right", lon: 103.8, lat: 1.25 },
  { id: "korea-strait", label: "KOREA STRAIT", kind: "chokepoint", side: "left", lon: 129.2, lat: 34.4 },
  { id: "ningbo", label: "NINGBO", kind: "port", side: "left", lon: 121.6, lat: 29.9 },
  { id: "ulsan", label: "ULSAN", kind: "port", side: "right", lon: 129.38, lat: 35.5 },
];


const main = build({ topo: load("land-110m.json"), bbox: [[38, -12], [150, 46]], width: 1000, step: 10, points: MAIN_POINTS });

const banner = `// 자동 생성 파일 — scripts/build-hero-map.mjs. 직접 수정하지 말 것.
// 해안선: Natural Earth 4.1.0 (public domain), world-atlas 패키지(ISC). 메르카토르 투영.
// 지점 좌표는 표시용 근사값.
`;
const body = `${banner}
export interface MapPoint { id: string; label: string; kind: "chokepoint" | "port"; side: "left" | "right"; lon: number; lat: number; x: number; y: number }
export interface ProjectedMap { width: number; height: number; land: string; graticule: string; points: MapPoint[] }

export const HERO_MAP: ProjectedMap = ${JSON.stringify(main)};
`;
writeFileSync(new URL("../src/data/geo/hero-map.ts", import.meta.url), body);
console.log("main", main.width, main.height, "land", main.land.length, "grat", main.graticule.length);
