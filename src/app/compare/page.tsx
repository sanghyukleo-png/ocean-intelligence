"use client";

import { useMemo, useState } from "react";
import { Columns3, Sparkles } from "lucide-react";
import { PageIntro } from "@/components/page-intro";
import { Card } from "@/components/ui/card";
import { VesselIcon } from "@/components/vessel-icon";
import { mockVessels } from "@/data/mockVessels";
import { buildCompareRows, generateComparisonInsight } from "@/lib/vesselCompare";
import { cn, formatNumber } from "@/lib/utils";

const MAX_SELECTION = 4;
const DEFAULT_SELECTION = ["v-01", "v-05"];

export default function ComparePage() {
  const [selectedIds, setSelectedIds] = useState<string[]>(DEFAULT_SELECTION);

  const selectedVessels = useMemo(
    () => selectedIds.map((id) => mockVessels.find((v) => v.id === id)!).filter(Boolean),
    [selectedIds]
  );

  const rows = useMemo(() => buildCompareRows(selectedVessels), [selectedVessels]);
  const insights = useMemo(() => generateComparisonInsight(selectedVessels), [selectedVessels]);

  function toggleVessel(id: string) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_SELECTION) return prev;
      return [...prev, id];
    });
  }

  return (
    <div className="space-y-8">
      <PageIntro
        icon={Columns3}
        eyebrow="선박 비교 분석"
        title="비교"
        purpose="선박 2~4척을 골라 주요 제원을 표로 비교합니다."
        howItWorks="선박을 체크하면 값 차이가 자동으로 표시됩니다."
      />

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">선박 선택</h3>
          <span className="text-[11px] text-muted">{selectedIds.length} / {MAX_SELECTION}척 선택됨</span>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {mockVessels.map((v) => {
            const checked = selectedIds.includes(v.id);
            const disabled = !checked && selectedIds.length >= MAX_SELECTION;
            return (
              <button
                key={v.id}
                onClick={() => toggleVessel(v.id)}
                disabled={disabled}
                className={cn(
                  "flex flex-col items-start gap-0.5 rounded-md border px-3 py-2 text-left text-xs transition-colors",
                  checked
                    ? "border-accent/50 bg-accent/10"
                    : disabled
                    ? "cursor-not-allowed border-border bg-surface-2 opacity-40"
                    : "border-border bg-surface hover:border-accent/30"
                )}
              >
                <VesselIcon vesselType={v.vesselType} className="h-6 w-11" />
                <span className="font-medium text-foreground">{v.vesselName}</span>
                <span className="text-[10px] text-muted">{v.vesselType} · {v.builtYear}년</span>
              </button>
            );
          })}
        </div>
      </Card>

      {selectedVessels.length < 2 ? (
        <Card className="border-dashed py-10 text-center">
          <p className="text-xs text-muted">비교하려면 선박을 2척 이상 선택하세요.</p>
        </Card>
      ) : (
        <>
          <Card className="overflow-x-auto p-0">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-[10px] uppercase tracking-wide text-muted">
                  <th className="px-4 py-3 font-medium">항목</th>
                  {selectedVessels.map((v) => (
                    <th key={v.id} className="px-4 py-3 font-medium text-foreground">
                      <VesselIcon vesselType={v.vesselType} className="mb-1 h-6 w-11" />
                      {v.vesselName}
                      <div className="mt-0.5 text-[10px] font-normal normal-case text-muted">{v.owner}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.key} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5 text-muted">
                      {row.label} <span className="text-border">({row.unit})</span>
                    </td>
                    {row.values.map((v, i) => (
                      <td
                        key={i}
                        className={cn(
                          "px-4 py-2.5 font-mono-num",
                          row.bestIndex === i ? "font-semibold text-accent" : "text-foreground"
                        )}
                      >
                        {v === undefined ? "—" : row.key === "builtYear" ? v : formatNumber(v)}
                        {row.bestIndex === i && <span className="ml-1 text-[10px]">★</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <Card>
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-accent" />
              <h3 className="text-sm font-semibold text-foreground">AI 상업 인사이트 · 데모</h3>
            </div>
            {insights.length > 0 ? (
              <ul className="mt-3 space-y-2 text-xs leading-relaxed">
                {insights.map((insight, i) => (
                  <li key={i} className="flex gap-1.5 text-foreground">
                    <span className="text-accent">·</span>
                    {insight}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-xs text-muted">선택된 선박에서 유의미한 차이를 찾지 못했습니다.</p>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
