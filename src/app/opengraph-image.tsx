import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { logoSymbolSvg } from "@/components/brand/logo";

export const alt = "OCEAN INTELLIGENCE — 정유·석유화학 해상 오퍼레이션 데스크";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const pretendardBold = await readFile(join(process.cwd(), "src/app/fonts/Pretendard-Bold.og.otf"));

const TOOLS = ["Laytime", "Freight", "Netback", "Quantity", "Schedule", "Q88"];

// 히어로 축소판: 등심선 + 항로 호. 실제 좌표가 아닌 장식용 도형.
function heroArtSvg() {
  const contours = [0, 1, 2, 3, 4, 5]
    .map((i) => {
      const rx = 180 + i * 62;
      const ry = 120 + i * 44;
      return `<ellipse cx="1010" cy="420" rx="${rx}" ry="${ry}" transform="rotate(-18 1010 420)" stroke="#1B2437" stroke-width="1.25" fill="none"/>`;
    })
    .join("");
  const routes = [
    "M560 560 C 720 360, 900 300, 1180 250",
    "M620 600 C 780 470, 980 470, 1180 410",
    "M700 300 C 840 200, 1000 160, 1180 130",
  ]
    .map(
      (d, i) =>
        `<path d="${d}" stroke="#4FD1C5" stroke-opacity="${[0.9, 0.55, 0.35][i]}" stroke-width="2" fill="none" stroke-linecap="round"/>`
    )
    .join("");
  const ports = [
    [560, 560],
    [620, 600],
    [700, 300],
  ]
    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#4FD1C5"/><circle cx="${x}" cy="${y}" r="12" stroke="#4FD1C5" stroke-opacity="0.35" fill="none"/>`)
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">${contours}${routes}${ports}</svg>`;
}

const b64 = (s: string) => `data:image/svg+xml;base64,${Buffer.from(s).toString("base64")}`;

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "#070B14",
          color: "#E8EDF7",
          fontFamily: "Pretendard",
        }}
      >
        {/* 해도 격자 */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            backgroundImage:
              "linear-gradient(to right, rgba(232,237,247,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(232,237,247,0.05) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            backgroundImage: "radial-gradient(circle at 50% -10%, rgba(79,209,197,0.14), transparent 60%)",
          }}
        />
        <img src={b64(heroArtSvg())} width={1200} height={630} alt="" style={{ position: "absolute", inset: 0 }} />

        <div style={{ display: "flex", flexDirection: "column", padding: "64px 72px", width: "100%", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <img src={b64(logoSymbolSvg({ frameColor: "#E8EDF7", routeColor: "#4FD1C5", size: 44 }))} width={44} height={44} alt="" />
            <div style={{ display: "flex", fontSize: 22, letterSpacing: "0.14em" }}>
              <span>OCEAN</span>
              <span style={{ width: 1, height: 22, background: "#2A3650", margin: "0 14px" }} />
              <span style={{ color: "#8A96AD" }}>INTELLIGENCE</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", marginTop: 92 }}>
            <span style={{ fontSize: 18, letterSpacing: "0.14em", color: "#4FD1C5" }}>MARINE OPERATIONS DESK</span>
            <span style={{ fontSize: 76, lineHeight: 1.06, letterSpacing: "-0.03em", marginTop: 20 }}>해상 오퍼레이션을</span>
            <span style={{ fontSize: 76, lineHeight: 1.06, letterSpacing: "-0.03em" }}>숫자로 끝냅니다</span>
            <span style={{ fontSize: 24, color: "#8A96AD", marginTop: 24 }}>
              정유·석유화학 선적·용선·수출입 실무를 위한 계산 도구
            </span>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: "auto" }}>
            {TOOLS.map((t) => (
              <span
                key={t}
                style={{
                  display: "flex",
                  fontSize: 18,
                  padding: "8px 16px",
                  borderRadius: 999,
                  border: "1px solid #2A3650",
                  background: "#0C1220",
                  color: "#E8EDF7",
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Pretendard", data: pretendardBold, style: "normal", weight: 700 }],
    }
  );
}
