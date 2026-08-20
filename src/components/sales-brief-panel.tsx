"use client";

import { useState } from "react";
import { Check, Copy, FileText, Loader2, Sparkles } from "lucide-react";
import { ScoredOpportunity, MarketSignal, SalesBrief } from "@/types";
import { generateSalesBrief } from "@/lib/salesBrief";
import { Card, CardLabel } from "@/components/ui/card";

type Status = "idle" | "loading" | "success" | "error";

export function SalesBriefPanel({
  opportunity,
  signals,
}: {
  opportunity: ScoredOpportunity;
  signals: MarketSignal[];
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [brief, setBrief] = useState<SalesBrief | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    setStatus("loading");
    try {
      // 시뮬레이션 처리 시퀀스 — 실제 서비스에서는 이 단계가
      // AIProvider.generateSalesBrief()를 호출합니다. 이 데모 경로는 전부 결정론적입니다.
      await new Promise((r) => setTimeout(r, 700));
      const result = generateSalesBrief(opportunity, signals);
      setBrief(result);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  function handleCopy() {
    if (!brief) return;
    const text = [
      `영업 브리프 — ${brief.customer}`,
      "",
      "요약",
      brief.executiveSummary,
      "",
      "핵심 발견",
      ...brief.keyFindings.map((f) => `- ${f}`),
      "",
      "상업적 평가",
      brief.commercialAssessment,
      "",
      "고객 기회",
      brief.customerOpportunity,
      "",
      "추천 영업 토킹포인트",
      ...brief.talkingPoints.map((t) => `- ${t}`),
      "",
      "추천 다음 액션",
      brief.recommendedNextAction,
    ].join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-accent" />
          <h3 className="text-sm font-semibold text-foreground">영업 브리프 생성</h3>
        </div>
        {status === "success" && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 rounded border border-border px-2 py-1 text-[11px] text-muted hover:bg-surface-2 hover:text-foreground"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? "복사됨" : "복사"}
          </button>
        )}
      </div>

      {status === "idle" && (
        <div className="mt-4 flex flex-col items-center gap-3 rounded-md border border-dashed border-border py-8 text-center">
          <FileText size={20} className="text-muted" />
          <p className="max-w-xs text-xs text-muted">
            시장 시그널, 영업기회 점수, 상업적 평가를 결합해 간결한 AI 영업기획 브리프를
            생성합니다.
          </p>
          <button
            onClick={handleGenerate}
            className="rounded-md bg-accent px-4 py-1.5 text-xs font-semibold text-background hover:opacity-90"
          >
            브리프 생성
          </button>
        </div>
      )}

      {status === "loading" && (
        <div className="mt-4 flex flex-col items-center gap-2 py-8 text-center">
          <Loader2 size={18} className="animate-spin text-accent" />
          <p className="text-xs text-muted">상업적 서사를 종합하는 중…</p>
        </div>
      )}

      {status === "success" && brief && (
        <div className="mt-4 space-y-4 text-xs leading-relaxed">
          <span className="inline-block rounded border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-medium tracking-wide text-accent">
            AI 생성 인사이트 · 데모
          </span>

          <div>
            <CardLabel>요약</CardLabel>
            <p className="mt-1 text-foreground">{brief.executiveSummary}</p>
          </div>

          <div>
            <CardLabel>핵심 발견</CardLabel>
            <ul className="mt-1 space-y-1">
              {brief.keyFindings.map((f, i) => (
                <li key={i} className="flex gap-1.5 text-foreground">
                  <span className="text-accent">·</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <CardLabel>상업적 평가</CardLabel>
            <p className="mt-1 text-foreground">{brief.commercialAssessment}</p>
          </div>

          <div>
            <CardLabel>고객 기회</CardLabel>
            <p className="mt-1 text-foreground">{brief.customerOpportunity}</p>
          </div>

          <div>
            <CardLabel>추천 영업 토킹포인트</CardLabel>
            <ul className="mt-1 space-y-1">
              {brief.talkingPoints.map((t, i) => (
                <li key={i} className="flex gap-1.5 text-foreground">
                  <span className="text-accent">·</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <CardLabel>추천 다음 액션</CardLabel>
            <p className="mt-1 font-medium text-foreground">{brief.recommendedNextAction}</p>
          </div>
        </div>
      )}
    </Card>
  );
}
