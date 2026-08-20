"use client";

import { Navigation } from "lucide-react";
import { Port } from "@/lib/voyageDemo";

const W = 600;
const H = 260;

function project(lat: number, lon: number) {
  return { x: ((lon + 180) / 360) * W, y: ((90 - lat) / 180) * H };
}

export function VoyageMap({
  origin,
  destination,
  progressPct,
  etaDays,
}: {
  origin: Port;
  destination: Port;
  progressPct: number;
  etaDays: number;
}) {
  const o = project(origin.lat, origin.lon);
  const d = project(destination.lat, destination.lon);
  const t = progressPct / 100;
  const shipX = o.x + (d.x - o.x) * t;
  const shipY = o.y + (d.y - o.y) * t;
  const angle = (Math.atan2(d.y - o.y, d.x - o.x) * 180) / Math.PI;

  const graticules = [];
  for (let x = 0; x <= W; x += W / 12) graticules.push(x);
  const hGraticules = [];
  for (let y = 0; y <= H; y += H / 6) hGraticules.push(y);

  return (
    <div className="relative overflow-hidden rounded-md border border-border bg-gradient-to-b from-[#0b3a52] to-[#0e2a3d]">
      <div className="absolute left-2 top-2 z-10 flex items-center gap-1.5 rounded-full border border-warning/40 bg-warning/15 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-warning">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-warning" />
        시뮬레이션 항적 · 데모
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-56 w-full">
        {graticules.map((x) => (
          <line key={`v${x}`} x1={x} y1={0} x2={x} y2={H} stroke="#ffffff" strokeOpacity={0.06} />
        ))}
        {hGraticules.map((y) => (
          <line key={`h${y}`} x1={0} y1={y} x2={W} y2={y} stroke="#ffffff" strokeOpacity={0.06} />
        ))}

        <line
          x1={o.x}
          y1={o.y}
          x2={d.x}
          y2={d.y}
          stroke="#38bdf8"
          strokeWidth={1.5}
          strokeDasharray="5 4"
          opacity={0.8}
        />

        <circle cx={o.x} cy={o.y} r={4} fill="#38bdf8" />
        <text x={o.x + 7} y={o.y - 6} fontSize="10" fill="#e2e8f0" fontWeight={600}>
          {origin.name}
        </text>

        <circle cx={d.x} cy={d.y} r={4} fill="#f97316" />
        <text x={d.x + 7} y={d.y - 6} fontSize="10" fill="#e2e8f0" fontWeight={600}>
          {destination.name}
        </text>

        <g transform={`translate(${shipX}, ${shipY}) rotate(${angle})`}>
          <circle r={9} fill="#f97316" opacity={0.2} />
          <path d="M-5 4 L6 0 L-5 -4 Z" fill="#fb923c" stroke="#fff" strokeWidth={0.5} />
        </g>
      </svg>
      <div className="flex items-center justify-between border-t border-white/10 px-3 py-2 text-[11px] text-white/80">
        <span className="flex items-center gap-1.5">
          <Navigation size={12} className="text-accent" />
          진행률 {progressPct}%
        </span>
        <span>예상 도착 {etaDays}일 후</span>
      </div>
    </div>
  );
}
