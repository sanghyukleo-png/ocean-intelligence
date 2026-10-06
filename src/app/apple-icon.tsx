import { ImageResponse } from "next/og";
import { logoSymbolSvg } from "@/components/brand/logo";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  // iOS가 모서리를 자동으로 둥글게 깎으므로 배경은 꽉 채운다.
  const svg = logoSymbolSvg({ frameColor: "#E8EDF7", routeColor: "#4FD1C5", size: 112 });
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#070B14",
        }}
      >
        <img src={`data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`} width={112} height={112} alt="" />
      </div>
    ),
    { ...size }
  );
}
