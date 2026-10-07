"use client";

import { useId, useMemo, useState } from "react";
import { Award, Check, Columns3 } from "lucide-react";
import { PageShell } from "@/components/shell/page-shell";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge, DataBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Reveal } from "@/components/motion/reveal";
import { VesselIcon } from "@/components/vessel-icon";
import { mockVessels } from "@/data/mockVessels";
import { buildCompareRows, generateComparisonInsight, type CompareRow } from "@/lib/vesselCompare";
import { cn, formatNum } from "@/lib/utils";
import type { Vessel } from "@/types";

const MIN_SELECTION = 2;
const MAX_SELECTION = 4;
const DEFAULT_SELECTION = ["v-01", "v-05"];

/** 행 안의 값들이 같은 소수 자릿수로 보이도록 최대 자릿수(최대 2)를 쓴다 */
function rowDecimals(row: CompareRow) {
  if (row.key === "builtYear") return 0;
  return Math.min(
    2,
    Math.max(0, ...row.values.map((v) => (typeof v === "number" ? (String(v).split(".")[1]?.length ?? 0) : 0)))
  );
}

function formatCell(row: CompareRow, value: number | undefined, decimals: number) {
  if (value === undefined) return "—";
  if (row.key === "builtYear") return String(value);
  return formatNum(value, { decimals });
}

const NBSP = "\u00A0";
/** 폭 0 단어 잇기 문자(U+2060): 보이지 않고 줄바꿈만 막는다 */
const WORD_JOINER = "\u2060";

/**
 * 요약 문장의 줄바꿈 보정(표시 전용 — 문장 내용은 바꾸지 않는다).
 * 선명은 한 줄에 두고, 괄호를 앞뒤 낱말에 붙여 '96,000MT)' / '이'처럼
 * 조사가 떨어지는 단어 중간 줄바꿈을 막는다.
 */
function keepWordsTogether(text: string, vesselNames: string[]) {
  let out = text;
  for (const name of vesselNames) out = out.split(name).join(name.replaceAll(" ", NBSP));
  return out
    .replace(/([가-힣A-Za-z0-9])\(/g, `$1${WORD_JOINER}(`)
    .replace(/\)(?=[가-힣])/g, `)${WORD_JOINER}`);
}

/** 선종의 괄호 묶음('(LNG-Ready)')은 줄바꿈하지 않는다 — 좁은 칸에서 'LNG-' / 'Ready)'로 끊기는 것을 막는다 */
function VesselTypeText({ type }: { type: string }) {
  return type
    .split(/(\([^)]*\))/)
    .filter(Boolean)
    .map((part, i) =>
      part.startsWith("(") ? (
        <span key={i} className="whitespace-nowrap">
          {part}
        </span>
      ) : (
        part
      )
    );
}

function CompareTable({ vessels, rows }: { vessels: Vessel[]; rows: CompareRow[] }) {
  return (
    // relative: 셀 안 sr-only(절대 위치) 텍스트의 기준 상자를 스크롤 영역 안에 둔다.
    // 없으면 바깥 Reveal 섹션(transform)이 기준이 되어 클리핑을 벗어나고 모바일에서 페이지가 가로로 넘친다.
    // scroll-shade-x: 값이 오른쪽 정렬이라 잘린 열이 빈칸으로만 보이므로, 오른쪽에 내용이 더 있으면 음영을 띄운다.
    <div
      role="region"
      aria-label="선박 제원 비교표"
      tabIndex={0}
      className="scroll-shade-x relative overflow-x-auto rounded-xl border border-line"
    >
      {/* 열 최소 폭: 모바일 96 + 112×n (390px에서 2척이 스크롤 없이 들어간다) · 데스크톱 176 + 152×n.
          안쪽 min-w로 바닥을 둔다 — 표가 넘칠 때 셀 width만으로는 열이 줄어 '재화중/량톤'처럼 끊긴다 */}
      <table className="w-full border-separate border-spacing-0 text-[0.8125rem]">
        <caption className="sr-only">
          선택한 선박 {vessels.length}척의 제원 비교. 최고 표시는 해당 항목에서 가장 유리한 값입니다.
        </caption>
        <thead>
          <tr>
            <th
              scope="col"
              className="sticky left-0 z-20 w-24 border-b border-r border-line bg-raised px-3 py-3 text-left align-bottom md:w-44 md:px-4"
            >
              <span className="type-label block min-w-18 text-fg-label md:min-w-36">항목</span>
            </th>
            {vessels.map((v) => (
              <th
                key={v.id}
                scope="col"
                className="border-b border-line px-3 py-3 text-right align-bottom font-normal md:px-4"
              >
                <span className="flex min-w-22 flex-col items-end gap-1 md:min-w-30">
                  <VesselIcon vesselType={v.vesselType} className="h-6 w-11" />
                  <span className="text-sm font-semibold leading-snug text-fg">{v.vesselName}</span>
                  <span className="text-xs leading-snug text-fg-muted">
                    <VesselTypeText type={v.vesselType} />
                  </span>
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const decimals = rowDecimals(row);
            // 건조연도는 단위 없이 연도만. 선박마다 단위가 다르면(화물창 CBM·TEU) 칸마다 단위를 붙인다
            const unit = row.key === "builtYear" ? null : row.cellUnits ? "선박별 단위" : row.unit || null;
            return (
              <tr key={row.key} className="group">
                <th
                  scope="row"
                  className="sticky left-0 z-10 border-b border-r border-line bg-raised px-3 py-3 text-left font-normal transition-colors group-last:border-b-0 group-hover:bg-subtle md:px-4"
                >
                  {/* 좁은 첫 열(모바일)에서는 단위를 항목 아래 줄에 둔다 */}
                  <span className="flex min-w-18 flex-col md:min-w-36 md:flex-row md:items-baseline md:gap-2">
                    <span className="text-fg">{row.label}</span>
                    {unit && <span className="whitespace-nowrap text-xs text-fg-muted">{unit}</span>}
                  </span>
                </th>
                {row.values.map((value, i) => {
                  const best = row.bestIndex === i;
                  const cellUnit = value !== undefined ? row.cellUnits?.[i] : undefined;
                  return (
                    <td
                      key={vessels[i].id}
                      className="num whitespace-nowrap border-b border-line px-3 py-3 text-right transition-colors group-last:border-b-0 group-hover:bg-subtle md:px-4"
                    >
                      {best ? (
                        <span className="inline-flex items-center gap-1 align-middle font-semibold text-fg">
                          <Award size={14} strokeWidth={2} aria-hidden="true" className="text-accent" />
                          {formatCell(row, value, decimals)}
                          <span className="sr-only"> (최고)</span>
                        </span>
                      ) : (
                        <span className={cn("align-middle", value === undefined ? "text-fg-muted" : "text-fg")}>
                          {formatCell(row, value, decimals)}
                          {cellUnit && <span className="ml-1 text-xs text-fg-muted">{cellUnit}</span>}
                          {value === undefined && <span className="sr-only">값 없음</span>}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function CompareClient() {
  const [selectedIds, setSelectedIds] = useState<string[]>(DEFAULT_SELECTION);
  const limitId = useId();

  const selectedVessels = useMemo(
    () => selectedIds.map((id) => mockVessels.find((v) => v.id === id)).filter((v): v is Vessel => Boolean(v)),
    [selectedIds]
  );
  const rows = useMemo(() => buildCompareRows(selectedVessels), [selectedVessels]);
  const insights = useMemo(() => generateComparisonInsight(selectedVessels), [selectedVessels]);
  const vesselNames = selectedVessels.map((v) => v.vesselName);
  const atLimit = selectedIds.length >= MAX_SELECTION;

  function toggleVessel(id: string) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_SELECTION) return prev;
      return [...prev, id];
    });
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="VESSELS"
        title="선박 비교"
        description="선박 2~4척을 골라 주요 제원을 나란히 비교합니다."
        assumptionsTitle="비교 기준"
        assumptions={
          <>
            <p>
              <strong>최고 표시</strong> — DWT·건조연도·속력·화물창 용량은 높을수록, 연료소모량은 낮을수록 유리한 값으로
              봅니다. 총톤수·전장·형폭·흘수는 부두·항로 조건에 따라 유불리가 달라 표시하지 않습니다. 모든 값이 같으면 표시하지
              않습니다.
            </p>
            <p>
              <strong>화물창 용량 단위</strong> — 컨테이너선은 적재 컨테이너 수(TEU), 그 외 선종은 화물창 용적(CBM)입니다. 두
              단위가 섞이면 칸마다 단위를 붙이고 최고 표시를 하지 않습니다.
            </p>
            <p>
              <strong>비교 요약</strong> — 고정 규칙으로 만든 문장입니다(선령 차이 · DWT ÷ 일일 연료소모량 · 최대 선복량 ·
              대체연료 사양). 선령은 2026년 기준입니다. AI가 쓰지 않습니다.
            </p>
            <p>
              <strong>한계</strong> — 선종이 다르면 화물창 용량·연료소모량의 단순 비교는 의미가 제한적입니다. 연료소모량은
              선박마다 기준 속력·적재 상태가 다를 수 있습니다.
            </p>
            <p>
              <strong>데이터</strong> — 시연용 가상 선박 10척(DEMO)입니다. 실제 선박·선주와 관계없습니다.
            </p>
          </>
        }
      />

      <Card>
        <CardHeader
          as="h2"
          title={
            <span className="flex flex-wrap items-center gap-2">
              비교할 선박 <DataBadge grade="demo" />
            </span>
          }
          actions={
            <>
              <p className="text-sm text-fg-muted" aria-live="polite">
                <span className="num font-semibold text-fg">{selectedIds.length}</span> / {MAX_SELECTION}척
                <span className="sr-only"> 선택됨</span>
              </p>
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])} disabled={selectedIds.length === 0}>
                선택 해제
              </Button>
            </>
          }
          className="flex-wrap items-center"
        />

        <div role="group" aria-label="선박 목록" className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {mockVessels.map((v) => {
            const checked = selectedIds.includes(v.id);
            const disabled = !checked && atLimit;
            return (
              <button
                key={v.id}
                type="button"
                aria-pressed={checked}
                aria-disabled={disabled || undefined}
                aria-describedby={disabled ? limitId : undefined}
                onClick={() => {
                  if (!disabled) toggleVessel(v.id);
                }}
                className={cn(
                  "flex min-h-11 min-w-0 flex-col gap-2 rounded-lg border p-3 text-left transition-colors duration-150",
                  checked
                    ? "border-accent bg-accent/8"
                    : disabled
                      ? "cursor-not-allowed border-line bg-inset opacity-45"
                      : "border-line bg-inset hover:border-line-strong hover:bg-subtle"
                )}
              >
                {/* 아이콘 줄에 체크 표시를 두어 아래 선명·선종 줄이 카드 폭을 모두 쓴다 */}
                <span className="flex items-start justify-between gap-2">
                  <VesselIcon vesselType={v.vesselType} className={cn("h-6 w-11", checked && "text-accent")} />
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                      checked ? "border-accent bg-accent text-accent-ink" : "border-line-strong"
                    )}
                  >
                    {checked && <Check size={12} strokeWidth={3} />}
                  </span>
                </span>
                <span className="min-w-0">
                  <span className="block text-[0.8125rem] font-semibold leading-snug text-fg">{v.vesselName}</span>
                  <span className="mt-1 block text-xs leading-snug text-fg-muted">
                    <VesselTypeText type={v.vesselType} />{" "}
                    <span className="whitespace-nowrap">
                      · <span className="num">{v.builtYear}</span>
                    </span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <p id={limitId} className="mt-3 text-xs leading-relaxed text-fg-muted">
          {atLimit
            ? `최대 ${MAX_SELECTION}척을 골랐습니다. 다른 선박을 넣으려면 하나를 해제하세요.`
            : `${MIN_SELECTION}척 이상, 최대 ${MAX_SELECTION}척까지 고를 수 있습니다.`}
        </p>
      </Card>

      {selectedVessels.length < MIN_SELECTION ? (
        <EmptyState
          icon={Columns3}
          title={`선박을 ${MIN_SELECTION}척 이상 선택하세요`}
          description="위 목록에서 비교할 선박을 고르면 제원표와 비교 요약이 나타납니다."
          className="mt-8"
        />
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-12">
          <Reveal as="section" className="min-w-0 xl:col-span-8">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <h2 className="type-h2 text-fg">제원 비교</h2>
              <DataBadge grade="demo" />
            </div>
            <CompareTable vessels={selectedVessels} rows={rows} />
            <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-fg-muted">
              {/* 첫 줄 높이(20px) 상자 안에서 아이콘을 세로 가운데 정렬 */}
              <span aria-hidden="true" className="flex h-5 shrink-0 items-center text-accent">
                <Award size={14} strokeWidth={2} />
              </span>
              <span>
                항목별 가장 유리한 값 — DWT·건조연도·속력·화물창은 높을수록, 연료소모량은 낮을수록. 나머지 항목과 단위가 섞인
                화물창(CBM·TEU)은 표시하지 않습니다.
              </span>
            </p>
          </Reveal>

          <Reveal as="section" delay={0.06} className="min-w-0 xl:col-span-4">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <h2 className="type-h2 text-fg">규칙 기반 비교 요약</h2>
              <Badge tone="neutral" title="고정 규칙으로 만든 문장 — AI가 생성하지 않음">
                템플릿
              </Badge>
              {/* 문장 속 선령·DWT·효율 수치도 데모 선박 데이터에서 나온다 */}
              <DataBadge grade="demo" />
            </div>
            <Card>
              <p className="text-[0.8125rem] leading-relaxed text-fg-muted">
                고정 규칙으로 만든 문장입니다. AI가 생성하지 않습니다.
              </p>
              {insights.length > 0 ? (
                <ul className="mt-4 space-y-3 border-t border-line pt-4">
                  {insights.map((insight) => (
                    <li key={insight} className="flex gap-3 text-sm leading-relaxed text-fg">
                      <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" />
                      <span>{keepWordsTogether(insight, vesselNames)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 border-t border-line pt-4 text-sm text-fg-muted">
                  선택한 선박 사이에서 규칙에 해당하는 차이를 찾지 못했습니다.
                </p>
              )}
            </Card>
          </Reveal>
        </div>
      )}
    </PageShell>
  );
}
