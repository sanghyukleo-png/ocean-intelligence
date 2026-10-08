"use client";

import { useId, useMemo, useState, useSyncExternalStore } from "react";
import { ChartLine, ChevronRight, RotateCcw, TriangleAlert } from "lucide-react";
import { calculateTce, type TceInputs, type TceResult } from "@/lib/tce";
import { BUNKER_FIELDS, EMPTY_BUNKER, readBunkerInput, subscribeBunkerInput } from "@/lib/bunker-input";
import { clamp } from "@/lib/input-parse";
import { cn, formatNum, type NumFormat } from "@/lib/utils";
import { CalculatorLayout } from "@/components/layout/calculator-layout";
import { AnimatedNumber } from "@/components/motion/animated-number";
import { Badge, DataBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { NumberInput } from "@/components/ui/number-input";
import { Stat } from "@/components/ui/stat";
import { formatPct, TceSensitivityChart, type SensitivityPoint } from "@/components/analytics/tce-sensitivity-chart";

type Key = keyof TceInputs;
type Draft = { [K in Key]: number | null };

interface InputSpec {
  label: string;
  unit: string;
  step: number;
  min: number;
  max?: number;
  /** 0을 허용하지 않는다 (속력) */
  positive?: boolean;
  /**
   * 소수 자릿수 상한 — 표시와 계산이 같은 값을 쓰도록 입력값을 이 자릿수로 반올림해 저장한다.
   * NumberInput이 step 기준으로 남기는 자릿수(step 소수 자릿수 + 2) 이하로 둔다.
   */
  digits: number;
  tip?: string;
  /** 숫자 입력 옆 빠른 조정 슬라이더 — 민감도가 큰 3개(운임·벙커 가격·속력)에만 붙인다 */
  range?: { min: number; max: number; step: number; format: NumFormat };
}

/** 입력 정의: 단위·증감 단위·허용 범위. 예시 기본값은 두지 않는다(2026-10-08 — 임의 숫자 표시 금지). */
const SPEC: Record<Key, InputSpec> = {
  cargoQuantity: { label: "화물량", unit: "MT", step: 1000, min: 0, digits: 2 },
  distanceNm: {
    label: "운항거리",
    unit: "nm",
    step: 100,
    min: 0,
    digits: 1,
    tip: "적재항 → 양하항 편도 해상 거리. 공선 구간은 계산하지 않습니다.",
  },
  speedKnots: {
    label: "속력",
    unit: "kn",
    step: 0.1,
    min: 0,
    max: 30,
    positive: true,
    digits: 2,
    range: { min: 8, max: 18, step: 0.1, format: { decimals: 1, suffix: " kn" } },
  },
  bunkerPricePerTon: {
    label: "벙커 가격",
    unit: "$/MT",
    step: 5,
    min: 0,
    max: 5000,
    digits: 2,
    tip: "해당 항구의 최신 벙커 견적을 넣으세요. 시황의 ‘벙커가 직접 입력’ 값을 불러올 수 있습니다.",
    range: { min: 300, max: 1000, step: 5, format: { prefix: "$" } },
  },
  fuelConsumptionPerDay: {
    label: "일일 소모",
    unit: "MT/day",
    step: 0.5,
    min: 0,
    digits: 2,
    tip: "해상 주행 중 하루 연료 소모량. 정박·대기 중 소모는 계산하지 않습니다.",
  },
  portCost: {
    label: "항비",
    unit: "USD",
    step: 1000,
    min: 0,
    digits: 2,
    tip: "대리점 PDA 견적 기준으로 넣으세요.",
  },
  canalCost: { label: "운하 통과비", unit: "USD", step: 1000, min: 0, digits: 2, tip: "수에즈·파나마 등. 통과하지 않으면 0." },
  commissionPct: { label: "커미션", unit: "%", step: 0.25, min: 0, max: 100, digits: 2, tip: "운임 수익에 대한 수수료 합계 비율입니다." },
  waitingDays: {
    label: "대기일수",
    unit: "days",
    step: 0.5,
    min: 0,
    max: 365,
    digits: 2,
    tip: "항해 외에 더하는 일수. 이 기간의 연료 소모는 계산하지 않습니다.",
  },
  freightRate: {
    label: "운임",
    unit: "$/MT",
    step: 0.5,
    min: 0,
    digits: 3,
    range: { min: 10, max: 60, step: 0.5, format: { prefix: "$", decimals: 1 } },
  },
};

/** compact: 휴대폰에서도 2열(짧은 숫자 입력만 있는 묶음) */
const GROUPS: { title: string; keys: Key[]; compact: boolean; dailyFuel?: boolean }[] = [
  { title: "화물·항로", keys: ["cargoQuantity", "distanceNm", "speedKnots"], compact: true },
  { title: "연료", keys: ["bunkerPricePerTon", "fuelConsumptionPerDay"], compact: false, dailyFuel: true },
  { title: "비용", keys: ["portCost", "canalCost", "commissionPct", "waitingDays"], compact: true },
  { title: "운임", keys: ["freightRate"], compact: false },
];

// 빈 입력으로 시작한다. 운하·대기는 "없음"이 기본이라 0
const DEFAULT_DRAFT: Draft = {
  freightRate: null,
  cargoQuantity: null,
  distanceNm: null,
  speedKnots: null,
  bunkerPricePerTon: null,
  fuelConsumptionPerDay: null,
  portCost: null,
  canalCost: 0,
  commissionPct: null,
  waitingDays: 0,
};
const KEYS = Object.keys(DEFAULT_DRAFT) as Key[];

function fieldError(key: Key, value: number | null): string | undefined {
  const s = SPEC[key];
  if (value === null) return "값을 입력하세요";
  if (s.positive && value <= 0) return "0보다 큰 값을 입력하세요";
  if (value < s.min) return `${formatNum(s.min)} 이상으로 입력하세요`;
  if (s.max !== undefined && value > s.max) return `${formatNum(s.max)} 이하로 입력하세요`;
  return undefined;
}

function toInputs(draft: Draft): TceInputs | null {
  return KEYS.some((k) => fieldError(k, draft[k])) ? null : (draft as TceInputs);
}

/** 벙커 가격만 −40%~+40%(5% 간격)로 바꿔 같은 엔진으로 다시 계산 */
function sensitivity(inputs: TceInputs): SensitivityPoint[] {
  const points: SensitivityPoint[] = [];
  for (let pct = -40; pct <= 40; pct += 5) {
    const price = inputs.bunkerPricePerTon * (1 + pct / 100);
    points.push({ pct, price, tce: calculateTce({ ...inputs, bunkerPricePerTon: price }).tcePerDay });
  }
  return points;
}

/** 규칙 기반 해설(템플릿) — 기존 문구·조건 그대로 */
function insightText(r: TceResult) {
  return Math.abs(r.bunkerCost) > Math.abs(r.voyageProfit) * 0.3
    ? "이 시나리오에서는 연료비가 지배적인 민감도 요인입니다. 벙커유 가격 상승이 예상 TCE를 크게 낮추므로, 연비가 우수한 선형이나 벙커유 헤지 논의를 우선 검토할 필요가 있습니다."
    : "현재 시나리오에서는 운임과 화물량이 벙커유 가격보다 예상 TCE에 더 큰 영향을 주는 주요 요인입니다.";
}

const USD: NumFormat = { prefix: "$" };

/** 입력값을 표시 자릿수로 반올림 — 칸에 보이는 숫자와 계산에 쓰는 숫자를 같게 둔다 (toFixed는 Intl 표시와 같은 반올림) */
function roundTo(value: number, digits: number) {
  return Number(value.toFixed(digits));
}

/** 슬라이더 읽기값: 반올림 없이 칸과 같은 자릿수로 — 접두·접미는 슬라이더 형식을 따른다 */
function rangeValueText(value: number, format: NumFormat, digits: number) {
  const n = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: Math.min(format.decimals ?? 0, digits),
    maximumFractionDigits: digits,
  }).format(Math.abs(value));
  return `${value < 0 ? "−" : ""}${format.prefix ?? ""}${n}${format.suffix ?? ""}`;
}

/**
 * 숫자 입력 옆 빠른 조정 슬라이더 — 같은 상태를 공유하므로 숫자 입력과 항상 일치한다.
 * 칸 값이 비었거나 슬라이더 범위 밖이면 손잡이는 끝에 머물고, 보조기기에는 실제 값과 "범위 밖"을 알린다.
 */
function RangeAssist({
  label,
  value,
  min,
  max,
  step,
  format,
  digits,
  onChange,
}: {
  label: string;
  value: number | null;
  min: number;
  max: number;
  step: number;
  format: NumFormat;
  digits: number;
  onChange: (v: number) => void;
}) {
  const v = clamp(value ?? min, min, max);
  const pct = ((v - min) / (max - min)) * 100;
  const outside = value === null || value < min || value > max;
  const valueText =
    value === null
      ? "값 없음"
      : outside
        ? `${rangeValueText(value, format, digits)} · 슬라이더 범위 밖`
        : rangeValueText(value, format, digits);
  return (
    <div className="min-w-0 flex-1 md:pt-2">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={v}
        aria-label={`${label} 조정`}
        aria-valuetext={valueText}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn("oi-range block transition-opacity duration-150", outside && "opacity-50")}
        style={{ "--pct": `${pct}%` } as React.CSSProperties}
      />
      <div aria-hidden="true" className="num -mt-2 flex justify-between gap-2 text-xs text-fg-muted md:mt-0">
        <span>{formatNum(min, format)}</span>
        {outside && <span className="font-sans text-fg">{value === null ? "값 없음" : "범위 밖"}</span>}
        <span>{formatNum(max, format)}</span>
      </div>
    </div>
  );
}

function InputField({ k, value, onChange }: { k: Key; value: number | null; onChange: (v: number | null) => void }) {
  const s = SPEC[k];
  const commit = (v: number | null) => onChange(v === null ? null : roundTo(v, s.digits));
  const input = (
    <NumberInput
      value={value}
      onValueChange={commit}
      unit={s.unit}
      step={s.step}
      min={s.min}
      max={s.max}
      maxFractionDigits={s.digits}
      className={s.range ? "w-32 shrink-0 sm:w-40" : undefined}
    />
  );
  return (
    // 빈 칸은 오류로 칠하지 않는다(처음엔 모두 비어 있음) — 계산 여부는 결과 쪽 안내가 알려 준다
    <Field label={s.label} tip={s.tip} error={value === null ? undefined : fieldError(k, value)} className={s.range ? "col-span-full" : undefined}>
      {s.range ? (
        <div className="flex items-start gap-4">
          {input}
          <RangeAssist label={s.label} value={value} {...s.range} digits={s.digits} onChange={commit} />
        </div>
      ) : (
        input
      )}
    </Field>
  );
}

/** 읽기 전용 파생값: 일일 소모 × 벙커 가격 — 입력 칸으로 오해하지 않도록 상자 없이 값만 둔다 */
/** 시황 화면에서 직접 입력한 벙커가(이 브라우저 저장)를 한 번에 넣는 버튼 — 저장값이 없으면 안내만 */
function BunkerPresets({ onPick }: { onPick: (v: number) => void }) {
  const bunker = useSyncExternalStore(subscribeBunkerInput, readBunkerInput, () => EMPTY_BUNKER);
  const saved = BUNKER_FIELDS.filter((f) => bunker.prices[f.key] !== undefined);
  return (
    <div className="col-span-full flex flex-wrap items-center gap-2 text-xs text-fg-muted">
      {saved.length ? (
        <>
          <span>직접 입력한 벙커가{bunker.asOf ? ` (${bunker.asOf})` : ""}:</span>
          {saved.map((f) => (
            <Button key={f.key} size="sm" variant="ghost" onClick={() => onPick(bunker.prices[f.key]!)}>
              {f.fuel} {f.port} ${formatNum(bunker.prices[f.key]!, { decimals: 0 })}
            </Button>
          ))}
        </>
      ) : (
        <span>시황 화면 &lsquo;벙커가 직접 입력&rsquo;에 견적을 넣어 두면 여기서 불러올 수 있습니다.</span>
      )}
    </div>
  );
}

function DailyFuelCost({ value }: { value: number | null }) {
  const id = useId();
  return (
    <div className="min-w-0">
      <div className="mb-2 flex min-h-4 items-center justify-between gap-2">
        <label htmlFor={id} className="type-label truncate text-fg-label">
          하루 연료비
        </label>
        <DataBadge grade="calc" className="-my-1" />
      </div>
      <output
        id={id}
        aria-live="off"
        className="num flex h-11 items-center justify-end gap-1 border-b border-line px-3 text-[0.9375rem] font-medium text-fg md:h-10"
      >
        {formatNum(value, USD)}
        <span className="text-xs text-fg-muted">/day</span>
      </output>
      <p className="mt-2 text-xs leading-relaxed text-fg-muted">항해 중 일일 소모 × 벙커 가격</p>
    </div>
  );
}

export function TceCalculator() {
  const [draft, setDraft] = useState<Draft>(DEFAULT_DRAFT);
  const set = (key: Key) => (value: number | null) => setDraft((prev) => ({ ...prev, [key]: value }));

  const inputs = useMemo(() => toInputs(draft), [draft]);
  const result = useMemo(() => (inputs ? calculateTce(inputs) : null), [inputs]);
  // 총 일수 0(거리·대기일수 모두 0)이면 엔진은 TCE 0을 돌려주지만 의미 없는 값이므로 표시하지 않는다
  const r = result && result.totalVoyageDays > 0 ? result : null;
  const points = useMemo(() => (inputs && r ? sensitivity(inputs) : null), [inputs, r]);
  const isDefault = KEYS.every((k) => draft[k] === DEFAULT_DRAFT[k]);

  // 벙커 $10/MT 상승 시 TCE 변화 — TCE가 벙커 가격에 선형이므로 기울기 × 10
  const per10 = inputs && r ? -(inputs.fuelConsumptionPerDay * r.transitDays * 10) / r.totalVoyageDays : null;
  const fuel = draft.fuelConsumptionPerDay;
  const price = draft.bunkerPricePerTon;
  const dailyFuel =
    fuel !== null && price !== null && !fieldError("fuelConsumptionPerDay", fuel) && !fieldError("bunkerPricePerTon", price)
      ? fuel * price
      : null;

  const problem = !inputs
    ? KEYS.some((k) => draft[k] === null)
      ? "모든 칸에 값을 넣으면 TCE를 계산합니다."
      : "허용 범위를 벗어난 입력이 있어 계산하지 않았습니다. 입력값 아래 안내를 확인하세요."
    : !r
      ? "총 일수가 0이라 TCE를 계산할 수 없습니다. 운항거리나 대기일수를 입력하세요."
      : null;

  const inputsPane = (
    <>
      <h2 className="sr-only">입력값</h2>
      {GROUPS.map((g) => (
        <Card key={g.title}>
          <CardHeader title={g.title} />
          <div className={cn("grid gap-x-4 gap-y-5 sm:grid-cols-2", g.compact ? "grid-cols-2" : "grid-cols-1")}>
            {g.keys.map((k) => (
              <InputField key={k} k={k} value={draft[k]} onChange={set(k)} />
            ))}
            {g.dailyFuel && <DailyFuelCost value={dailyFuel} />}
            {g.dailyFuel && <BunkerPresets onPick={set("bunkerPricePerTon")} />}
          </div>
        </Card>
      ))}

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 pt-1">
        <p className="min-w-0 text-xs leading-relaxed text-fg-muted">입력값은 이 화면에만 있고 서버로 보내지 않습니다.</p>
        {/* disabled 대신 aria-disabled: 누른 직후 비활성이 되어도 키보드 포커스가 본문으로 튀지 않는다 */}
        <Button
          size="sm"
          aria-disabled={isDefault}
          onClick={() => !isDefault && setDraft(DEFAULT_DRAFT)}
          className="h-11 aria-disabled:cursor-default aria-disabled:opacity-40 aria-disabled:hover:border-line-strong aria-disabled:hover:bg-raised aria-disabled:active:translate-y-0 md:h-8"
        >
          <RotateCcw size={14} strokeWidth={1.75} aria-hidden="true" />
          입력 비우기
        </Button>
      </div>
    </>
  );

  const profitUp = r ? r.voyageProfit >= 0 : true;

  const resultsPane = (
    <>
      <Card>
        <h2 className="sr-only">계산 결과</h2>
        <Stat
          label="TCE · 정기용선환산료"
          value={r?.tcePerDay}
          format={{ prefix: "$", decimals: 0 }}
          unit="/day"
          size="xl"
          badge={<DataBadge grade="calc" />}
          hint="항해 이익 ÷ 총 일수"
        />
        <div role="status" className="mt-4 text-xs leading-5">
          {problem ? (
            <p className="flex items-start gap-2 text-down">
              <span className="flex h-5 shrink-0 items-center">
                <TriangleAlert size={14} strokeWidth={1.75} aria-hidden="true" />
              </span>
              <span>{problem}</span>
            </p>
          ) : null}
        </div>
        {!problem && (
          <p className="flex items-start gap-2 text-xs leading-5 text-fg-muted">
            <span className="flex h-5 shrink-0 items-center">
              <TriangleAlert size={14} strokeWidth={1.75} className="text-warn" aria-hidden="true" />
            </span>
            <span>
              공선 구간·정박 중 연료·하역일이 빠져 있어 실제보다 높게 나옵니다. 근거와 한계는 상단{" "}
              <span className="whitespace-nowrap">‘계산 근거 · 가정’</span> 패널에 있습니다.
            </span>
          </p>
        )}
        <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-line pt-5 sm:grid-cols-3">
          <Stat label="항해 수익" value={r?.voyageRevenue} format={USD} size="sm" />
          <Stat label="벙커 비용" value={r?.bunkerCost} format={USD} size="sm" />
          <Stat label="총 비용" value={r?.totalVoyageCost} format={USD} size="sm" hint="벙커·항비·운하·커미션" />
          <Stat
            label="항해 이익"
            value={r?.voyageProfit}
            format={{ prefix: "$", signed: true }}
            size="sm"
            hint={r ? (profitUp ? "이익" : "손실") : undefined}
            tone={r ? (profitUp ? "up" : "down") : "default"}
          />
          <Stat label="항해일수" value={r?.transitDays} format={{ decimals: 1 }} unit="days" size="sm" />
          <Stat label="총 일수" value={r?.totalVoyageDays} format={{ decimals: 1 }} unit="days" size="sm" hint="항해 + 대기" />
        </div>
      </Card>

      <Card>
        <CardHeader title="벙커 가격 민감도 · TCE" actions={<DataBadge grade="calc" />} className="mb-1" />
        <p className="text-[0.8125rem] leading-relaxed text-fg-muted">
          다른 입력은 그대로 두고 벙커 가격만 ±40% 바꿨을 때의 TCE($/day).
          {per10 !== null && (
            <>
              {" "}
              벙커가 $10/MT 오를 때마다 TCE <span className="num text-fg">{formatNum(per10, { prefix: "$", decimals: 0 })}</span>/day.
            </>
          )}
        </p>
        <div className="mt-4">
          {points ? (
            <>
              <TceSensitivityChart data={points} />
              <details className="group mt-3">
                <summary className="-ml-2 inline-flex h-11 cursor-pointer select-none items-center gap-1 rounded-lg px-2 text-xs text-fg-muted hover:text-fg md:h-8 [&::-webkit-details-marker]:hidden">
                  <ChevronRight
                    size={14}
                    strokeWidth={1.75}
                    aria-hidden="true"
                    className="transition-transform duration-150 group-open:rotate-90"
                  />
                  표로 보기
                </summary>
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full min-w-72 text-xs">
                    <caption className="sr-only">벙커 가격 변동별 TCE</caption>
                    <thead>
                      <tr className="border-b border-line text-fg-muted">
                        <th scope="col" className="py-2 pr-4 text-left font-medium">
                          벙커 변동
                        </th>
                        <th scope="col" className="py-2 pr-4 text-right font-medium">
                          벙커 가격 ($/MT)
                        </th>
                        <th scope="col" className="py-2 text-right font-medium">
                          TCE ($/day)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {points
                        .filter((p) => p.pct % 10 === 0)
                        .map((p) => (
                          <tr key={p.pct} className="border-b border-line last:border-0">
                            <th scope="row" className="py-2 pr-4 text-left font-normal text-fg-muted">
                              {p.pct === 0 ? "현재" : formatPct(p.pct)}
                            </th>
                            <td className="num py-2 pr-4 text-right text-fg">{formatNum(p.price, { decimals: 0 })}</td>
                            <td className={cn("num py-2 text-right", p.pct === 0 ? "font-semibold text-accent" : "text-fg")}>
                              {formatNum(p.tce, { decimals: 0 })}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </>
          ) : (
            <EmptyState
              icon={ChartLine}
              title="그래프를 그릴 수 없습니다"
              description="입력값을 모두 채우고 총 일수가 0보다 크면 다시 그립니다."
              className="h-60 py-0"
            />
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title="해설" actions={<Badge>규칙 기반 해설 · 템플릿</Badge>} className="mb-3" />
        {r ? (
          <p className="text-sm leading-relaxed text-fg">{insightText(r)}</p>
        ) : (
          <p className="text-sm leading-relaxed text-fg-muted">계산 결과가 있어야 해설을 고릅니다.</p>
        )}
        <p className="mt-3 text-xs leading-relaxed text-fg-muted">
          고정 규칙으로 두 문장 중 하나를 고릅니다: 벙커 비용이 항해 이익 절댓값의 30%를 넘으면 연료비 문구, 아니면
          운임·화물량 문구.
        </p>
      </Card>
    </>
  );

  const mobileSummary = (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="type-label text-fg-label">TCE</p>
        <p className="mt-1 flex items-baseline gap-1">
          <AnimatedNumber value={r?.tcePerDay} prefix="$" className="text-lg font-semibold leading-none text-fg" />
          <span className="text-xs text-fg-muted">/day</span>
        </p>
      </div>
      <DataBadge grade="calc" />
    </div>
  );

  return <CalculatorLayout inputs={inputsPane} results={resultsPane} mobileSummary={mobileSummary} />;
}
