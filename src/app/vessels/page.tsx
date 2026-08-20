"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, CircleDashed, FileScan, Loader2, Radar, RotateCcw, Sparkles } from "lucide-react";
import { PageIntro } from "@/components/page-intro";
import { Card, CardLabel } from "@/components/ui/card";
import { VesselIcon } from "@/components/vessel-icon";
import { VoyageMap } from "@/components/voyage-map";
import { mockVessels, sampleVesselSpecText } from "@/data/mockVessels";
import { extractVesselFromText, VesselExtractionResult } from "@/lib/vesselExtraction";
import { getDemoRoute } from "@/lib/voyageDemo";
import { cn, formatNumber } from "@/lib/utils";

const STEPS = ["원문 텍스트 스캔", "라벨-값 패턴 매칭", "필드 정규화 및 검증", "신뢰도·출처 산출"];

type Status = "idle" | "processing" | "done";

function confidenceColor(confidence: number) {
  if (confidence === 0) return "text-negative";
  if (confidence >= 0.8) return "text-positive";
  return "text-warning";
}

export default function VesselsPage() {
  const [rawText, setRawText] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [stepIndex, setStepIndex] = useState(0);
  const [result, setResult] = useState<VesselExtractionResult | null>(null);
  const [trackedId, setTrackedId] = useState(mockVessels[0].id);
  const trackedVessel = mockVessels.find((v) => v.id === trackedId) ?? mockVessels[0];
  const route = useMemo(() => getDemoRoute(trackedVessel), [trackedVessel]);

  async function handleExtract() {
    if (!rawText.trim()) return;
    setStatus("processing");
    setResult(null);
    for (let i = 0; i < STEPS.length; i++) {
      setStepIndex(i);
      await new Promise((r) => setTimeout(r, 380));
    }
    setResult(extractVesselFromText(rawText));
    setStatus("done");
  }

  function handleLoadSample() {
    setRawText(sampleVesselSpecText);
    setResult(null);
    setStatus("idle");
  }

  function handleReset() {
    setRawText("");
    setResult(null);
    setStatus("idle");
  }

  return (
    <div className="space-y-8">
      <PageIntro
        icon={FileScan}
        eyebrow="선박 제원 인텔리전스"
        title="선박"
        purpose="선박 제원 텍스트를 붙여넣으면 핵심 정보를 자동으로 추출합니다."
        howItWorks="'샘플 불러오기'로 채운 뒤 '추출 시작'을 눌러보세요."
      />

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-foreground">원문 텍스트 입력</h3>
          <div className="flex gap-2">
            <button
              onClick={handleLoadSample}
              className="rounded border border-border px-3 py-1.5 text-[11px] font-medium text-muted hover:bg-surface-2 hover:text-foreground"
            >
              샘플 불러오기
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-1 rounded border border-border px-3 py-1.5 text-[11px] font-medium text-muted hover:bg-surface-2 hover:text-foreground"
            >
              <RotateCcw size={11} />
              초기화
            </button>
          </div>
        </div>

        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="Q88 또는 제원표 형태의 원문 텍스트를 붙여넣으세요. 예: Vessel Name: STAR ODYSSEY / IMO Number: 9812345 / Deadweight (DWT): 50,000 MT ..."
          rows={10}
          className="mt-3 w-full resize-y rounded-md border border-border bg-surface-2 p-3 font-mono text-xs leading-relaxed text-foreground outline-none focus:border-accent"
        />

        <div className="mt-3 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] text-muted">
            {rawText.trim() ? `${rawText.trim().length.toLocaleString()}자` : "텍스트를 입력하거나 샘플을 불러오세요."}
          </p>
          <button
            onClick={handleExtract}
            disabled={!rawText.trim() || status === "processing"}
            className="flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md bg-accent px-4 py-1.5 text-xs font-semibold text-background hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {status === "processing" ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
            추출 시작
          </button>
        </div>

        {status === "processing" && (
          <div className="mt-4 flex flex-wrap gap-3 border-t border-border pt-4">
            {STEPS.map((step, i) => (
              <span
                key={step}
                className={cn(
                  "flex items-center gap-1.5 rounded border px-2 py-1 text-[11px]",
                  i < stepIndex
                    ? "border-positive/30 bg-positive/10 text-positive"
                    : i === stepIndex
                    ? "border-accent/40 bg-accent/10 text-accent"
                    : "border-border bg-surface-2 text-muted"
                )}
              >
                {i < stepIndex ? (
                  <CheckCircle2 size={12} />
                ) : i === stepIndex ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <CircleDashed size={12} />
                )}
                {step}
              </span>
            ))}
          </div>
        )}
      </Card>

      {result && (
        <div className="space-y-4">
          <Card className="border-accent/30 bg-surface-2">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <CardLabel>추출 결과</CardLabel>
                <p className="mt-1 text-sm text-foreground">
                  {result.matchedCount} / {result.totalCount}개 필드 매칭 성공
                </p>
              </div>
              <div className="text-right">
                <CardLabel>종합 신뢰도</CardLabel>
                <p className={cn("font-mono-num text-2xl font-bold", confidenceColor(result.overallConfidence))}>
                  {Math.round(result.overallConfidence * 100)}%
                </p>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {result.fields.map((f) => (
              <Card key={f.key}>
                <div className="flex items-start justify-between gap-2">
                  <CardLabel>{f.label}</CardLabel>
                  <span className={cn("font-mono-num text-[10px] font-semibold", confidenceColor(f.confidence))}>
                    {Math.round(f.confidence * 100)}%
                  </span>
                </div>
                <p className={cn("mt-1 text-sm", f.value === null ? "text-negative" : "font-mono-num text-foreground")}>
                  {f.value === null
                    ? "미검출"
                    : typeof f.value === "number"
                    ? f.key === "builtYear"
                      ? f.value
                      : formatNumber(f.value)
                    : f.value}
                </p>
                {f.sourceText && (
                  <p className="mt-2 truncate rounded bg-surface-2 px-1.5 py-1 font-mono text-[10px] text-muted" title={f.sourceText}>
                    {f.sourceText}
                  </p>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      <section>
        <div className="mb-3">
          <h2 className="text-sm font-semibold tracking-wide text-foreground">선박 데이터베이스</h2>
          <p className="text-xs text-muted">
            비교(Compare) 모듈에서 선택 가능한 데모 선박 {mockVessels.length}척입니다. 아래 목록은 조회 전용입니다.
          </p>
        </div>
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead>
              <tr className="border-b border-border text-[10px] uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium"></th>
                <th className="px-4 py-3 font-medium">선명</th>
                <th className="px-4 py-3 font-medium">선종</th>
                <th className="px-4 py-3 font-medium">소유주</th>
                <th className="px-4 py-3 font-medium text-right">DWT</th>
                <th className="px-4 py-3 font-medium text-right">건조연도</th>
                <th className="px-4 py-3 font-medium">선급</th>
                <th className="px-4 py-3 font-medium">선적</th>
              </tr>
            </thead>
            <tbody>
              {mockVessels.map((v) => (
                <tr key={v.id} className="border-b border-border last:border-0 hover:bg-surface-2">
                  <td className="px-2 py-1.5">
                    <VesselIcon vesselType={v.vesselType} className="h-6 w-11" />
                  </td>
                  <td className="px-4 py-2.5 font-medium text-foreground">{v.vesselName}</td>
                  <td className="px-4 py-2.5 text-muted">{v.vesselType}</td>
                  <td className="px-4 py-2.5 text-muted">{v.owner}</td>
                  <td className="px-4 py-2.5 text-right font-mono-num text-foreground">{formatNumber(v.dwt)}</td>
                  <td className="px-4 py-2.5 text-right font-mono-num text-foreground">{v.builtYear}</td>
                  <td className="px-4 py-2.5 text-muted">{v.class}</td>
                  <td className="px-4 py-2.5 text-muted">{v.flag}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Radar size={15} className="text-accent" />
            <h2 className="text-sm font-bold tracking-wide text-foreground">실시간 위치 추적 (데모)</h2>
          </div>
          <select
            value={trackedId}
            onChange={(e) => setTrackedId(e.target.value)}
            className="rounded border border-border bg-surface px-2 py-1.5 text-xs text-foreground outline-none focus:border-accent"
          >
            {mockVessels.map((v) => (
              <option key={v.id} value={v.id}>
                {v.vesselName}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3 mb-3">
          <VesselIcon vesselType={trackedVessel.vesselType} className="h-9 w-16" />
          <div>
            <p className="text-sm font-bold text-foreground">{trackedVessel.vesselName}</p>
            <p className="text-[11px] text-muted">{trackedVessel.vesselType} · {trackedVessel.flag}</p>
          </div>
        </div>
        <VoyageMap
          origin={route.origin}
          destination={route.destination}
          progressPct={route.progressPct}
          etaDays={route.etaDays}
        />
      </section>
    </div>
  );
}
