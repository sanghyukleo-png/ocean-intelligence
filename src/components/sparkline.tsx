"use client";

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

export function Sparkline({
  data,
  color = "var(--accent)",
  height = 56,
}: {
  data: number[];
  color?: string;
  height?: number;
}) {
  const points = data.map((v, i) => ({
    i,
    v,
    label: i === 0 ? "6주 전" : i === data.length - 1 ? "현재" : "",
  }));
  const min = Math.min(...data);
  const max = Math.max(...data);
  const pad = (max - min) * 0.15 || 1;

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 4, right: 6, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 9, fill: "var(--muted)" }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
            interval={0}
          />
          <YAxis
            domain={[min - pad, max + pad]}
            tick={{ fontSize: 9, fill: "var(--muted)" }}
            axisLine={false}
            tickLine={false}
            width={30}
            tickFormatter={(v: number) => (Math.abs(v) >= 1000 ? `${Math.round(v / 1000)}k` : Math.round(v).toString())}
          />
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.75}
            dot={false}
            isAnimationActive={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
