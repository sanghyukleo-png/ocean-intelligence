"use client";

import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { calculateTce, DEFAULT_TCE_INPUTS, TceInputs } from "@/lib/tce";
import { Card, CardLabel } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";

function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="text-muted">{label}</span>
        <span className="font-mono-num text-foreground">
          {formatNumber(value, { maximumFractionDigits: 2 })} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--accent)]"
      />
    </div>
  );
}

function StaticField({
  label,
  value,
  onChange,
  unit,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  unit: string;
}) {
  return (
    <div>
      <CardLabel>{label}</CardLabel>
      <div className="mt-1 flex items-center gap-2">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full rounded border border-border bg-surface-2 px-2 py-1.5 font-mono-num text-sm text-foreground outline-none focus:border-accent"
        />
        <span className="shrink-0 text-xs text-muted">{unit}</span>
      </div>
    </div>
  );
}

export function TceCalculator() {
  const [inputs, setInputs] = useState<TceInputs>(DEFAULT_TCE_INPUTS);

  function set<K extends keyof TceInputs>(key: K, value: number) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  const result = useMemo(() => calculateTce(inputs), [inputs]);

  const sensitivityData = useMemo(() => {
    const points = [];
    for (let i = -40; i <= 40; i += 10) {
      const bunker = inputs.bunkerPricePerTon * (1 + i / 100);
      const r = calculateTce({ ...inputs, bunkerPricePerTon: bunker });
      points.push({ pct: `${i > 0 ? "+" : ""}${i}%`, tce: Math.round(r.tcePerDay) });
    }
    return points;
  }, [inputs]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      <div className="space-y-4 lg:col-span-2">
        <Card>
          <h3 className="mb-4 text-sm font-semibold text-foreground">Voyage Inputs</h3>
          <div className="space-y-4">
            <StaticField label="Cargo Quantity" unit="tons" value={inputs.cargoQuantity} onChange={(v) => set("cargoQuantity", v)} />
            <StaticField label="Distance" unit="nm" value={inputs.distanceNm} onChange={(v) => set("distanceNm", v)} />
            <StaticField label="Fuel Consumption" unit="tons/day" value={inputs.fuelConsumptionPerDay} onChange={(v) => set("fuelConsumptionPerDay", v)} />
            <StaticField label="Port Cost" unit="$" value={inputs.portCost} onChange={(v) => set("portCost", v)} />
            <StaticField label="Canal Cost" unit="$" value={inputs.canalCost} onChange={(v) => set("canalCost", v)} />
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 text-sm font-semibold text-foreground">Sensitivity Sliders</h3>
          <div className="space-y-5">
            <Slider label="Freight Rate" unit="$/ton" min={10} max={60} step={0.5} value={inputs.freightRate} onChange={(v) => set("freightRate", v)} />
            <Slider label="Bunker Price" unit="$/ton" min={300} max={1000} step={5} value={inputs.bunkerPricePerTon} onChange={(v) => set("bunkerPricePerTon", v)} />
            <Slider label="Waiting Days" unit="days" min={0} max={15} step={0.5} value={inputs.waitingDays} onChange={(v) => set("waitingDays", v)} />
            <Slider label="Commission" unit="%" min={0} max={6.25} step={0.25} value={inputs.commissionPct} onChange={(v) => set("commissionPct", v)} />
            <Slider label="Speed" unit="knots" min={9} max={18} step={0.1} value={inputs.speedKnots} onChange={(v) => set("speedKnots", v)} />
          </div>
        </Card>
      </div>

      <div className="space-y-4 lg:col-span-3">
        <Card className="border-accent/30 bg-surface-2">
          <CardLabel>Time Charter Equivalent</CardLabel>
          <p className="mt-1 font-mono-num text-4xl font-bold text-accent">
            ${formatNumber(result.tcePerDay, { maximumFractionDigits: 0 })}
            <span className="ml-1 text-base font-normal text-muted">/day</span>
          </p>
        </Card>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card>
            <CardLabel>Voyage Revenue</CardLabel>
            <p className="mt-1 font-mono-num text-lg text-foreground">${formatNumber(result.voyageRevenue, { maximumFractionDigits: 0 })}</p>
          </Card>
          <Card>
            <CardLabel>Bunker Cost</CardLabel>
            <p className="mt-1 font-mono-num text-lg text-foreground">${formatNumber(result.bunkerCost, { maximumFractionDigits: 0 })}</p>
          </Card>
          <Card>
            <CardLabel>Total Cost</CardLabel>
            <p className="mt-1 font-mono-num text-lg text-foreground">${formatNumber(result.totalVoyageCost, { maximumFractionDigits: 0 })}</p>
          </Card>
          <Card>
            <CardLabel>Voyage Profit</CardLabel>
            <p className={`mt-1 font-mono-num text-lg ${result.voyageProfit >= 0 ? "text-positive" : "text-negative"}`}>
              ${formatNumber(result.voyageProfit, { maximumFractionDigits: 0 })}
            </p>
          </Card>
        </div>

        <Card>
          <h3 className="mb-1 text-sm font-semibold text-foreground">Bunker Price Sensitivity</h3>
          <p className="mb-3 text-[11px] text-muted">TCE ($/day) response to ±40% bunker price shift</p>
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sensitivityData} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="pct" tick={{ fill: "var(--muted)", fontSize: 11 }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
                <YAxis tick={{ fill: "var(--muted)", fontSize: 11 }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }}
                  labelStyle={{ color: "var(--muted)" }}
                />
                <Line type="monotone" dataKey="tce" stroke="var(--accent)" strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <span className="inline-block rounded border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-medium tracking-wide text-accent">
            AI COMMERCIAL INSIGHT · DEMO
          </span>
          <p className="mt-3 text-xs leading-relaxed text-foreground">
            {Math.abs(result.bunkerCost) > Math.abs(result.voyageProfit) * 0.3
              ? "Fuel cost is a dominant sensitivity driver in this scenario. A higher bunker price materially reduces estimated TCE — favor fuel-efficient tonnage or bunker hedging discussion."
              : "Freight rate and cargo volume currently outweigh bunker price as the primary driver of estimated TCE for this voyage."}
          </p>
        </Card>
      </div>
    </div>
  );
}
