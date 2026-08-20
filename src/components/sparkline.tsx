"use client";

import { Line, LineChart, ResponsiveContainer, YAxis } from "recharts";

export function Sparkline({
  data,
  color = "var(--accent)",
  height = 36,
}: {
  data: number[];
  color?: string;
  height?: number;
}) {
  const points = data.map((v, i) => ({ i, v }));
  const min = Math.min(...data);
  const max = Math.max(...data);
  const pad = (max - min) * 0.15 || 1;

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <YAxis domain={[min - pad, max + pad]} hide />
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
