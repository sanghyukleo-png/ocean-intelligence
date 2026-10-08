"use client";

import { useSyncExternalStore } from "react";
import { Card } from "@/components/ui/card";
import { DataBadge } from "@/components/ui/badge";
import { Field, TextInput } from "@/components/ui/field";
import { NumberInput } from "@/components/ui/number-input";
import { BUNKER_FIELDS, EMPTY_BUNKER, readBunkerInput, subscribeBunkerInput, writeBunkerInput, type BunkerInput, type BunkerKey } from "@/lib/bunker-input";

/**
 * 벙커가 직접 입력 — 수집하지 않는 지표(약관상 게시 가능한 무료 소스 없음).
 * 이 브라우저에만 저장되고, 항차·항로 계산기가 기본값으로 불러온다. 입력 기준일·출처 메모를 함께 남긴다.
 */
export function BunkerInputCard() {
  // 서버 렌더는 빈 값, 하이드레이션 뒤 이 브라우저의 저장값
  const v = useSyncExternalStore(subscribeBunkerInput, readBunkerInput, () => EMPTY_BUNKER);

  function update(next: Partial<BunkerInput>) {
    writeBunkerInput({ ...readBunkerInput(), ...next, savedAt: new Date().toISOString() });
  }

  const setPrice = (key: BunkerKey, value: number | null) => {
    const prices = { ...v.prices };
    if (value === null) delete prices[key];
    else prices[key] = value;
    update({ prices });
  };

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-fg">벙커가 직접 입력</h3>
        <DataBadge grade="input" />
      </div>
      <p className="mt-2 text-[0.8125rem] leading-relaxed text-fg-muted">
        약관이 수집·재게시를 허용하는 무료 벙커가 소스가 없어 수집하지 않습니다. 공급사 견적 등을 넣어 두면 이 브라우저에만 저장되고 항차·항로
        계산기가 기본값으로 씁니다.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {BUNKER_FIELDS.map((f) => (
          <Field key={f.key} label={`${f.fuel} ${f.port}`}>
            <NumberInput value={v.prices[f.key] ?? null} onValueChange={(x) => setPrice(f.key, x)} unit="$/MT" step={1} min={0} max={5000} maxFractionDigits={1} placeholder="—" />
          </Field>
        ))}
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="시세 기준일">
          <TextInput type="date" value={v.asOf ?? ""} onChange={(e) => update({ asOf: e.target.value || null })} />
        </Field>
        <Field label="출처 메모" hint="예: ○○ 공급사 10/08 견적">
          <TextInput value={v.note} maxLength={120} onChange={(e) => update({ note: e.target.value })} placeholder="선택" />
        </Field>
      </div>
    </Card>
  );
}
