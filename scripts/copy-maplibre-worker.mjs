// MapLibre GL 6 ESM 빌드의 Web Worker 파일을 public/으로 복사한다(predev·prebuild에서 실행).
// 번들러가 워커 경로(new URL(…, import.meta.url))를 따라가지 못해, 같은 출처의 버전 경로에서 직접 내려준다.
// sea-map.tsx가 setWorkerUrl(`/vendor/maplibre-gl/<버전>/maplibre-gl-worker.mjs`)로 쓴다. 산출물은 git에서 제외.
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const pkgDir = path.join(root, "node_modules", "maplibre-gl");
const { version } = JSON.parse(fs.readFileSync(path.join(pkgDir, "package.json"), "utf8"));
const out = path.join(root, "public", "vendor", "maplibre-gl", version);
fs.mkdirSync(out, { recursive: true });
for (const f of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) {
  fs.copyFileSync(path.join(pkgDir, "dist", f), path.join(out, f));
}
console.log(`maplibre-gl ${version} worker → public/vendor/maplibre-gl/${version}/`);
