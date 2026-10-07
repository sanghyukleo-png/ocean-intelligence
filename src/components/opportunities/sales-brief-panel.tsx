"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowRight, Check, Copy, FileText } from "lucide-react";
import type { MarketSignal, SalesBrief, ScoredOpportunity } from "@/types";
import { generateSalesBrief } from "@/lib/salesBrief";
import { Card } from "@/components/ui/card";
import { Badge, DataBadge, formatKst } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { keepKoreanWords } from "@/components/opportunities/keep-words";

type Status = "idle" | "loading" | "success" | "error";

// 데모 경로는 전부 결정론적 템플릿이라 실제로는 즉시 끝난다.
// 무엇을 조합하는지 보이도록 단계만 짧게(총 ~0.7초) 보여준다.
// 실제 서비스에서는 이 자리에서 AIProvider.generateSalesBrief()를 호출한다.
const STEPS = ["점수·요인 불러오기", "시장 시그널 선별", "브리프 문장 조립"] as const;
const STEP_MS = 220;

const wait = (ms: number) => new Promise((r) => window.setTimeout(r, ms));

function briefToText(brief: SalesBrief) {
  return [
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
}

export function SalesBriefPanel({
  opportunity,
  signals,
  className,
}: {
  opportunity: ScoredOpportunity;
  signals: MarketSignal[];
  className?: string;
}) {
  const toast = useToast();
  const [status, setStatus] = useState<Status>("idle");
  const [step, setStep] = useState(0);
  const [brief, setBrief] = useState<SalesBrief | null>(null);
  const alive = useRef(true);
  const resultHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  // 생성 버튼이 사라지므로 포커스를 결과 첫 제목으로 옮긴다
  useEffect(() => {
    if (status === "success") resultHeading.current?.focus();
  }, [status]);

  async function handleGenerate() {
    setStatus("loading");
    setStep(0);
    try {
      for (let i = 0; i < STEPS.length; i++) {
        setStep(i);
        await wait(STEP_MS);
        if (!alive.current) return;
      }
      setBrief(generateSalesBrief(opportunity, signals));
      setStatus("success");
    } catch {
      if (alive.current) setStatus("error");
    }
  }

  async function handleCopy() {
    if (!brief) return;
    try {
      await navigator.clipboard.writeText(briefToText(brief));
      toast("브리프를 클립보드에 복사했습니다");
    } catch {
      toast("클립보드에 복사하지 못했습니다", "error");
    }
  }

  const announcement =
    status === "loading"
      ? `브리프 생성 중 — ${STEPS[step]} (${step + 1}/${STEPS.length})`
      : status === "success"
        ? "영업 브리프를 만들었습니다"
        : status === "error"
          ? "브리프를 만들지 못했습니다"
          : "";

  return (
    <Card className={className}>
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[0.9375rem] font-semibold leading-snug text-fg">영업 브리프</h2>
            <Badge>템플릿 생성</Badge>
            <DataBadge grade="demo" />
          </div>
          <p className="mt-1 text-[0.8125rem] leading-relaxed text-fg-muted">
            {status === "success" && brief
              ? `생성 ${formatKst(brief.generatedAt)} KST · 예시 데이터 기반 · 같은 입력이면 같은 문장`
              : "결정론적 템플릿 · 같은 입력이면 같은 문장"}
          </p>
        </div>
        {status === "success" && (
          <Button size="sm" onClick={handleCopy}>
            <Copy size={14} strokeWidth={1.75} aria-hidden="true" />
            복사
          </Button>
        )}
      </div>

      {status === "idle" && (
        <EmptyState
          icon={FileText}
          title="브리프 초안 만들기"
          description="영업기회 점수, 고객 시그널, 시장 배경을 템플릿에 넣어 영업 브리프 초안을 만듭니다."
          action={
            <Button variant="primary" onClick={handleGenerate}>
              브리프 생성
            </Button>
          }
        />
      )}

      {status === "loading" && (
        <div className="space-y-5">
          <div aria-hidden="true" className="h-1 overflow-hidden rounded-full bg-accent/15">
            <div
              className="h-full origin-left bg-accent transition-transform duration-200 ease-out"
              style={{ transform: `scaleX(${(step + 1) / STEPS.length})` }}
            />
          </div>
          <ol aria-hidden="true" className="space-y-3">
            {STEPS.map((label, i) => {
              const done = i < step;
              const current = i === step;
              return (
                <li key={label} className="flex items-center gap-3 text-[0.8125rem]">
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                      done && "border-up/40 bg-up/10 text-up",
                      current && "border-accent/50 text-accent",
                      !done && !current && "border-line-strong text-fg-faint"
                    )}
                  >
                    {done ? (
                      <Check size={12} strokeWidth={2.5} />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    )}
                  </span>
                  <span className={cn(done || current ? "text-fg" : "text-fg-muted")}>{label}</span>
                  <span className="num ml-auto text-xs text-fg-muted">
                    {i + 1}/{STEPS.length}
                  </span>
                </li>
              );
            })}
          </ol>
          <div aria-hidden="true" className="space-y-3 border-t border-line pt-5">
            <Skeleton className="h-3 w-1/3 rounded-full" />
            <Skeleton className="h-3 w-full rounded-full" />
            <Skeleton className="h-3 w-11/12 rounded-full" />
            <Skeleton className="h-3 w-4/5 rounded-full" />
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-start gap-3 rounded-lg border border-down/35 bg-down/10 p-4">
          <p className="flex items-center gap-2 text-sm text-down">
            <AlertTriangle size={15} strokeWidth={1.75} aria-hidden="true" />
            브리프를 만들지 못했습니다.
          </p>
          <Button size="sm" onClick={handleGenerate}>
            다시 시도
          </Button>
        </div>
      )}

      {status === "success" && brief && (
        <div className="space-y-5 text-[0.875rem] leading-relaxed">
          <BriefSection title="요약" headingRef={resultHeading}>
            <p className="text-fg">{keepKoreanWords(brief.executiveSummary)}</p>
          </BriefSection>

          <BriefSection title="핵심 발견">
            <BriefList items={brief.keyFindings} />
          </BriefSection>

          <BriefSection title="상업적 평가">
            <p className="text-fg">{keepKoreanWords(brief.commercialAssessment)}</p>
          </BriefSection>

          <BriefSection title="고객 기회">
            <p className="text-fg">{keepKoreanWords(brief.customerOpportunity)}</p>
          </BriefSection>

          <BriefSection title="추천 영업 토킹포인트">
            <BriefList items={brief.talkingPoints} />
          </BriefSection>

          <div className="rounded-lg border border-accent/30 bg-accent/10 p-4">
            <h3 className="type-label text-accent-text">추천 다음 액션</h3>
            <p className="mt-2 flex gap-2 font-medium text-fg">
              <ArrowRight size={16} strokeWidth={1.75} className="mt-[3px] shrink-0 text-accent" aria-hidden="true" />
              {keepKoreanWords(brief.recommendedNextAction)}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}

function BriefSection({
  title,
  headingRef,
  children,
}: {
  title: string;
  headingRef?: React.Ref<HTMLHeadingElement>;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 ref={headingRef} tabIndex={headingRef ? -1 : undefined} className="type-label text-fg-label">
        {title}
      </h3>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function BriefList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 text-fg">
          <span aria-hidden="true" className="mt-[0.6em] h-1 w-1 shrink-0 rounded-full bg-accent" />
          {keepKoreanWords(item)}
        </li>
      ))}
    </ul>
  );
}
