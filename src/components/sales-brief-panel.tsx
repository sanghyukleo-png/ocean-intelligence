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
      // Simulated processing sequence — in production this step would call
      // AIProvider.generateSalesBrief(). This demo path is fully deterministic.
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
      `SALES BRIEF — ${brief.customer}`,
      "",
      "EXECUTIVE SUMMARY",
      brief.executiveSummary,
      "",
      "KEY FINDINGS",
      ...brief.keyFindings.map((f) => `- ${f}`),
      "",
      "COMMERCIAL ASSESSMENT",
      brief.commercialAssessment,
      "",
      "CUSTOMER OPPORTUNITY",
      brief.customerOpportunity,
      "",
      "RECOMMENDED SALES TALKING POINTS",
      ...brief.talkingPoints.map((t) => `- ${t}`),
      "",
      "RECOMMENDED NEXT ACTION",
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
          <h3 className="text-sm font-semibold text-foreground">Generate Sales Brief</h3>
        </div>
        {status === "success" && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 rounded border border-border px-2 py-1 text-[11px] text-muted hover:bg-surface-2 hover:text-foreground"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? "Copied" : "Copy"}
          </button>
        )}
      </div>

      {status === "idle" && (
        <div className="mt-4 flex flex-col items-center gap-3 rounded-md border border-dashed border-border py-8 text-center">
          <FileText size={20} className="text-muted" />
          <p className="max-w-xs text-xs text-muted">
            Combine market signals, opportunity score, and commercial assessment into a concise
            AI sales planning brief.
          </p>
          <button
            onClick={handleGenerate}
            className="rounded-md bg-accent px-4 py-1.5 text-xs font-semibold text-background hover:opacity-90"
          >
            Generate Brief
          </button>
        </div>
      )}

      {status === "loading" && (
        <div className="mt-4 flex flex-col items-center gap-2 py-8 text-center">
          <Loader2 size={18} className="animate-spin text-accent" />
          <p className="text-xs text-muted">Synthesizing commercial narrative…</p>
        </div>
      )}

      {status === "success" && brief && (
        <div className="mt-4 space-y-4 text-xs leading-relaxed">
          <span className="inline-block rounded border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-medium tracking-wide text-accent">
            AI-GENERATED INSIGHT · DEMO
          </span>

          <div>
            <CardLabel>Executive Summary</CardLabel>
            <p className="mt-1 text-foreground">{brief.executiveSummary}</p>
          </div>

          <div>
            <CardLabel>Key Findings</CardLabel>
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
            <CardLabel>Commercial Assessment</CardLabel>
            <p className="mt-1 text-foreground">{brief.commercialAssessment}</p>
          </div>

          <div>
            <CardLabel>Customer Opportunity</CardLabel>
            <p className="mt-1 text-foreground">{brief.customerOpportunity}</p>
          </div>

          <div>
            <CardLabel>Recommended Sales Talking Points</CardLabel>
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
            <CardLabel>Recommended Next Action</CardLabel>
            <p className="mt-1 font-medium text-foreground">{brief.recommendedNextAction}</p>
          </div>
        </div>
      )}
    </Card>
  );
}
