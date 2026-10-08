"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookmarkPlus,
  Check,
  FileScan,
  Gauge,
  LoaderCircle,
  Regex,
  RotateCcw,
  ScanText,
  ShieldCheck,
  Ship,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { PageShell } from "@/components/shell/page-shell";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge, DataBadge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, TextArea } from "@/components/ui/field";
import { Stat } from "@/components/ui/stat";
import { DataTable, type Column } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Reveal } from "@/components/motion/reveal";
import { VesselIcon } from "@/components/vessel-icon";
import { emptyVessels, readMyVessels, removeMyVessel, saveMyVessel, subscribeMyVessels, vesselFromExtraction } from "@/lib/myVessels";
import { extractVesselFromText, type ExtractedField, type VesselExtractionResult } from "@/lib/vesselExtraction";
import { cn, formatNumber } from "@/lib/utils";
import type { Vessel } from "@/types";

const STEPS: { label: string; icon: LucideIcon }[] = [
  { label: "텍스트 스캔", icon: ScanText },
  { label: "라벨·값 매칭", icon: Regex },
  { label: "정규화·검증", icon: ShieldCheck },
  { label: "신뢰도 산출", icon: Gauge },
];
const STEP_MS = 380;

type Status = "idle" | "processing" | "done";

/** 신뢰도 등급: 색 + 글자로 함께 표시한다 */
function ConfidenceBadge({ confidence, showPct = true }: { confidence: number; showPct?: boolean }) {
  const pct = Math.round(confidence * 100);
  if (confidence === 0) {
    return (
      <Badge tone="neutral" className="border-dashed">
        미검출
      </Badge>
    );
  }
  return (
    <Badge tone={confidence >= 0.8 ? "up" : "warn"}>
      {confidence >= 0.8 ? "높음" : "낮음"}
      {showPct && <span className="num font-medium">{pct}%</span>}
    </Badge>
  );
}

/** 라벨은 찾았지만 숫자로 읽지 못한 필드는 값이 NaN으로 온다 — 값 없음으로 다룬다 */
function hasValue(field: ExtractedField) {
  if (field.value === null) return false;
  return typeof field.value !== "number" || Number.isFinite(field.value);
}

function formatFieldValue(field: ExtractedField) {
  if (!hasValue(field)) return "—";
  if (typeof field.value === "number") return field.key === "builtYear" ? String(field.value) : formatNumber(field.value);
  return field.value;
}

const DB_COLUMNS: Column<Vessel>[] = [
  {
    key: "name",
    header: "선명",
    cell: (v) => (
      <span className="flex items-center gap-3">
        <VesselIcon vesselType={v.vesselType} className="h-5 w-9" />
        <span className="font-medium text-fg">{v.vesselName}</span>
      </span>
    ),
    className: "whitespace-nowrap",
  },
  { key: "type", header: "선종", cell: (v) => <span className="text-fg-muted">{v.vesselType}</span>, className: "whitespace-nowrap" },
  { key: "owner", header: "소유주", cell: (v) => <span className="text-fg-muted">{v.owner ?? "—"}</span>, className: "whitespace-nowrap" },
  {
    key: "dwt",
    header: "DWT (MT)",
    numeric: true,
    sortValue: (v) => v.dwt,
    cell: (v) => formatNumber(v.dwt),
  },
  {
    key: "builtYear",
    header: "건조연도",
    numeric: true,
    sortValue: (v) => v.builtYear,
    cell: (v) => v.builtYear ?? "—",
  },
  { key: "imo", header: "IMO", cell: (v) => <span className="num text-fg-muted">{v.imo ?? "—"}</span>, className: "whitespace-nowrap" },
  { key: "loa", header: "LOA (m)", numeric: true, sortValue: (v) => v.loa, cell: (v) => formatNumber(v.loa) },
  { key: "draft", header: "흘수 (m)", numeric: true, sortValue: (v) => v.draft, cell: (v) => formatNumber(v.draft) },
  { key: "class", header: "선급", cell: (v) => <span className="text-fg-muted">{v.class ?? "—"}</span>, className: "whitespace-nowrap" },
  { key: "flag", header: "선적", cell: (v) => <span className="text-fg-muted">{v.flag ?? "—"}</span>, className: "whitespace-nowrap" },
  {
    key: "remove",
    header: <span className="sr-only">삭제</span>,
    cell: (v) => (
      <Button variant="ghost" size="sm" onClick={() => removeMyVessel(v.id)} aria-label={`${v.vesselName} 삭제`}>
        <Trash2 size={14} strokeWidth={1.75} aria-hidden="true" />
      </Button>
    ),
  },
];

/** 내 선박 — 이 브라우저에 저장한 추출 결과만(가상 선박 없음) */
function MyVessels() {
  const list = useSyncExternalStore(subscribeMyVessels, readMyVessels, emptyVessels);
  return (
    <Reveal as="section" className="mt-16 lg:mt-24">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="type-h2 text-fg">내 선박</h2>
            <DataBadge grade="calc" />
          </div>
          <p className="mt-2 text-[0.8125rem] text-fg-muted">추출 결과에서 저장한 선박 · 이 브라우저에만 저장(최대 20척)</p>
        </div>
        {list.length >= 2 && (
          <Link href="/compare" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            선박 비교
            <ArrowRight size={14} strokeWidth={1.75} aria-hidden="true" />
          </Link>
        )}
      </div>
      {list.length ? (
        <DataTable columns={DB_COLUMNS} rows={list} rowKey={(v) => v.id} caption={`내 선박 ${list.length}척`} />
      ) : (
        <EmptyState icon={Ship} title="저장한 선박이 없습니다" description="Q88·제원 텍스트를 추출한 뒤 ‘내 선박에 저장’을 누르면 여기에 쌓이고 선박 비교에 쓸 수 있습니다." />
      )}
    </Reveal>
  );
}

function ExtractionStepper({ status, stepIndex }: { status: Status; stepIndex: number }) {
  return (
    <ol aria-label="추출 단계" className="mt-5 grid grid-cols-4 border-t border-line pt-5">
      {STEPS.map((step, i) => {
        const state = status === "done" || i < stepIndex ? "done" : i === stepIndex ? "current" : "todo";
        const Icon = step.icon;
        return (
          <li
            key={step.label}
            aria-current={state === "current" ? "step" : undefined}
            className="relative flex min-w-0 flex-col items-center gap-2 px-1 text-center"
          >
            {i > 0 && (
              // 이전 단계 원 중심 → 현재 원 중심을 잇되 원(반지름 16px)에서 8px 띄운다
              <span
                aria-hidden="true"
                className={cn(
                  "absolute left-[calc(-50%+24px)] right-[calc(50%+24px)] top-4 h-px",
                  state === "todo" ? "bg-line" : "bg-up/50"
                )}
              />
            )}
            <span
              aria-hidden="true"
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border transition-colors duration-200",
                state === "done" && "border-up/40 bg-up/10 text-up",
                state === "current" && "border-accent bg-accent/10 text-accent",
                state === "todo" && "border-line bg-inset text-fg-faint"
              )}
            >
              {state === "done" ? (
                <Check size={15} strokeWidth={2.5} />
              ) : state === "current" ? (
                <LoaderCircle size={15} strokeWidth={2} className="animate-spin" />
              ) : (
                <Icon size={15} strokeWidth={1.75} />
              )}
            </span>
            <span className={cn("text-xs leading-snug", state === "current" ? "font-medium text-fg" : "text-fg-muted")}>
              {step.label}
              <span className="sr-only">{state === "done" ? " 완료" : state === "current" ? " 진행 중" : " 대기"}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function ResultsSkeleton() {
  return (
    // 장식용 자리표시 — 진행 상황은 aria-live 영역이 알린다
    <div aria-hidden="true" className="space-y-4">
      <Card>
        <Skeleton className="h-5 w-32" />
        <div className="mt-6 grid grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-7 w-20" />
            </div>
          ))}
        </div>
      </Card>
      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="space-y-3 bg-raised p-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SaveVesselButton({ result }: { result: VesselExtractionResult }) {
  const list = useSyncExternalStore(subscribeMyVessels, readMyVessels, emptyVessels);
  const vessel = vesselFromExtraction(result.vessel, result.overallConfidence);
  const saved = vessel ? list.some((v) => v.id === vessel.id && v.dwt === vessel.dwt && v.loa === vessel.loa) : false;
  if (!vessel) return <Badge tone="warn">선명 미검출 · 저장 불가</Badge>;
  return (
    <Button variant="secondary" size="sm" aria-disabled={saved} onClick={() => !saved && saveMyVessel(vessel)}>
      {saved ? <Check size={14} strokeWidth={2} aria-hidden="true" /> : <BookmarkPlus size={14} strokeWidth={1.75} aria-hidden="true" />}
      {saved ? "저장됨" : "내 선박에 저장"}
    </Button>
  );
}

function ExtractionResults({
  result,
  stale,
  onRerun,
}: {
  result: VesselExtractionResult;
  /** 추출 뒤 원문이 바뀌었으면 결과가 지금 텍스트와 맞지 않는다 */
  stale: boolean;
  onRerun: () => void;
}) {
  // 미확인 = 라벨을 못 찾음(미검출) + 라벨은 있으나 값을 읽지 못함(낮음)
  const unconfirmed = result.totalCount - result.matchedCount;
  const notFound = result.fields.filter((f) => f.confidence === 0).length;
  const unreadable = unconfirmed - notFound;
  return (
    <Reveal className="space-y-4">
      <Card>
        <CardHeader
          as="h2"
          title="추출 결과"
          actions={
            <>
              {stale && <Badge tone="warn">원문 변경됨</Badge>}
              {!stale && <SaveVesselButton result={result} />}
              <DataBadge grade="calc" />
            </>
          }
          className="mb-6"
        />
        {stale && (
          <div
            role="status"
            className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warn/40 bg-warn/8 px-4 py-3"
          >
            <p className="min-w-0 text-[0.8125rem] leading-relaxed text-fg">
              원문이 바뀌었습니다. 아래 결과는 이전 텍스트 기준입니다.
            </p>
            <Button variant="secondary" size="sm" onClick={onRerun}>
              <RotateCcw size={14} strokeWidth={1.75} aria-hidden="true" />
              다시 추출
            </Button>
          </div>
        )}
        <div className="grid grid-cols-3 gap-4">
          <Stat label="매칭 필드" value={result.matchedCount} from={0} unit={`/ ${result.totalCount}`} />
          <Stat
            label="종합 신뢰도"
            value={Math.round(result.overallConfidence * 100)}
            from={0}
            format={{ suffix: "%" }}
            hint={<ConfidenceBadge confidence={result.overallConfidence} showPct={false} />}
          />
          <Stat
            label="미확인"
            value={unconfirmed}
            from={0}
            unit="개"
            hint={
              unreadable > 0 ? (
                <>
                  <span className="whitespace-nowrap">
                    미검출 <span className="num">{notFound}</span>
                  </span>{" "}
                  ·{" "}
                  <span className="whitespace-nowrap">
                    읽기 실패 <span className="num">{unreadable}</span>
                  </span>
                </>
              ) : undefined
            }
          />
        </div>
      </Card>

      <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 xl:grid-cols-3">
        {result.fields.map((f) => {
          const present = hasValue(f);
          return (
            // dl의 항목 묶음: 직계 자식은 dt·dd뿐이고 배치는 grid로 한다
            <div key={f.key} className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-x-2 bg-raised px-4 py-3 sm:py-4">
              <dt className="col-start-1 row-start-1 min-w-0 self-center truncate text-xs font-medium text-fg-muted" title={f.label}>
                {f.label}
              </dt>
              <dd className="col-start-2 row-start-1 self-center">
                <ConfidenceBadge confidence={f.confidence} />
              </dd>
              <dd
                className={cn(
                  "num col-span-2 mt-1 truncate text-[0.9375rem] sm:mt-2",
                  present ? "text-fg" : "text-fg-muted"
                )}
                title={present ? String(f.value) : undefined}
              >
                {formatFieldValue(f)}
                {!present && (
                  <span className="sr-only">{f.sourceText ? "값을 숫자로 읽지 못함" : "값 없음"}</span>
                )}
              </dd>
              <dd
                className="col-span-2 mt-2 truncate border-t border-line pt-2 font-mono text-[0.6875rem] text-fg-label"
                title={f.sourceText ?? undefined}
              >
                {f.sourceText ?? "원문에서 라벨을 찾지 못함"}
              </dd>
            </div>
          );
        })}
      </dl>
      <p className="text-xs leading-relaxed text-fg-muted">
        값은 원문 줄에서 그대로 읽었고 단위는 바꾸지 않았습니다. 단위는 각 칸 아래의 원문 줄에서 확인하세요.
      </p>
    </Reveal>
  );
}

export default function VesselsClient() {
  const [rawText, setRawText] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [stepIndex, setStepIndex] = useState(0);
  const [result, setResult] = useState<VesselExtractionResult | null>(null);
  // 결과를 만든 원문 — 이후 편집으로 결과가 낡았는지 판단한다
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const resultsRef = useRef<HTMLElement>(null);
  // 진행 중에 초기화를 누르면 이전 실행 결과를 버린다
  const runRef = useRef(0);

  const trimmed = rawText.trim();
  const lineCount = trimmed ? trimmed.split(/\r?\n/).length : 0;
  const stale = result !== null && extractedText !== null && extractedText.trim() !== trimmed;

  async function handleExtract() {
    if (!trimmed || status === "processing") return;
    const run = ++runRef.current;
    setStatus("processing");
    setResult(null);
    for (let i = 0; i < STEPS.length; i++) {
      setStepIndex(i);
      await new Promise((r) => setTimeout(r, STEP_MS));
      if (run !== runRef.current) return;
    }
    setResult(extractVesselFromText(rawText));
    setExtractedText(rawText);
    setStatus("done");
    // 모바일에서는 결과가 입력 아래에 쌓이므로 결과로 이동
    if (window.matchMedia("(max-width: 1023px)").matches) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }));
    }
  }

  function handleReset() {
    runRef.current++;
    setRawText("");
    setResult(null);
    setExtractedText(null);
    setStatus("idle");
  }

  const liveMessage =
    status === "processing"
      ? `${stepIndex + 1}/${STEPS.length}단계 ${STEPS[stepIndex].label}`
      : status === "done" && result
        ? `추출 완료. ${result.totalCount}개 중 ${result.matchedCount}개 필드 매칭`
        : "";

  return (
    <PageShell>
      <PageHeader
        eyebrow="VESSELS · Q88"
        title="Q88 분석"
        description="선박 제원 텍스트를 붙여넣으면 핵심 필드를 추출합니다. PDF 업로드·Q88 원본 파서는 준비 중입니다."
        assumptionsTitle="추출 방식 · 한계"
        assumptions={
          <>
            <p>
              <strong>작동 방식</strong> — 붙여넣은 텍스트에서 &lsquo;Deadweight (DWT):&rsquo; 같은 영문 라벨을 찾아 바로 뒤의
              값을 읽습니다. 규칙(정규식) 기반이며 AI가 값을 추정하거나 채우지 않습니다.
            </p>
            <p>
              <strong>신뢰도</strong> — 라벨과 값을 모두 읽으면 95%, 라벨은 있으나 숫자로 읽을 수 없으면 15%, 라벨이 없으면
              0%(미검출). 종합 신뢰도는 매칭된 필드 수 ÷ 전체 18개이고, 미확인은 나머지(미검출 + 값 읽기 실패)입니다.
            </p>
            <p>
              <strong>처리 위치</strong> — 추출은 브라우저 안에서 실행되며 텍스트를 서버로 보내지 않습니다.
            </p>
            <p>
              <strong>한계</strong> — &lsquo;Deadweight (DWT): 값&rsquo; 같은 &lsquo;라벨: 값&rsquo; 줄만 인식합니다. 항목 번호가 붙은 Q88 원본, 한 줄에 여러
              값이 있는 항목, 단위 환산, PDF 업로드는 Q88 전용 파서(준비 중)에서 지원합니다.
            </p>
            <p>
              <strong>내 선박</strong> — 추출 결과에서 저장한 선박만 이 브라우저에 남습니다. 가상·예시 선박은 두지 않습니다.
            </p>
          </>
        }
      />

      <p className="sr-only" aria-live="polite">
        {liveMessage}
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section aria-label="원문 입력" className="min-w-0 lg:sticky lg:top-24 lg:col-span-5 lg:self-start">
          <Card>
            <Field
              label="원문 텍스트"
              hint={
                trimmed ? (
                  <>
                    <span className="num">{trimmed.length.toLocaleString("en-US")}</span>자 ·{" "}
                    <span className="num">{lineCount}</span>줄
                    {/* 단축키 안내는 키보드가 있는 넓은 화면에서만 */}
                    <span className="hidden md:inline"> · ⌘/Ctrl + Enter로 추출</span>
                  </>
                ) : (
                  "Q88·제원표의 '라벨: 값' 줄을 붙여넣으세요."
                )
              }
              aside={
                <span className="flex shrink-0 items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={handleReset} disabled={!rawText && !result}>
                    <RotateCcw size={14} strokeWidth={1.75} aria-hidden="true" />
                    초기화
                  </Button>
                </span>
              }
            >
              <TextArea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                // 추출 중에는 결과와 원문이 어긋나지 않게 편집을 막는다
                readOnly={status === "processing"}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    void handleExtract();
                  }
                }}
                placeholder={"Vessel Name: …\nIMO Number: …\nDeadweight (DWT): …\nLength Overall (LOA): …"}
                rows={14}
                spellCheck={false}
              />
            </Field>

            <div className="mt-4 flex justify-end">
              <Button variant="primary" onClick={handleExtract} disabled={!trimmed || status === "processing"}>
                {status === "processing" ? (
                  <LoaderCircle size={16} strokeWidth={2} className="animate-spin" aria-hidden="true" />
                ) : (
                  <ScanText size={16} strokeWidth={1.75} aria-hidden="true" />
                )}
                {status === "processing" ? "추출 중" : "추출 시작"}
              </Button>
            </div>

            {status !== "idle" && <ExtractionStepper status={status} stepIndex={stepIndex} />}
          </Card>
        </section>

        <section
          ref={resultsRef}
          aria-label="추출 결과"
          aria-busy={status === "processing"}
          className="min-w-0 scroll-mt-24 lg:col-span-7"
        >
          {status === "processing" ? (
            <ResultsSkeleton />
          ) : result ? (
            <ExtractionResults result={result} stale={stale} onRerun={() => void handleExtract()} />
          ) : (
            <EmptyState
              icon={FileScan}
              title="추출 결과가 여기에 표시됩니다"
              description="제원 텍스트를 붙여넣은 뒤 ‘추출 시작’을 누르세요. 필드마다 값·신뢰도·원문 줄이 나오고, 결과는 ‘내 선박’에 저장해 비교할 수 있습니다."
              className="h-full min-h-64"
            />
          )}
        </section>
      </div>

      <MyVessels />
    </PageShell>
  );
}
