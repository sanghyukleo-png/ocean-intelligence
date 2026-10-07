import { Fragment } from "react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/page-header";
import { PageShell } from "@/components/shell/page-shell";
import { TceCalculator } from "@/components/analytics/tce-calculator";

const DESCRIPTION = "운임·화물량·벙커·항비로 항차 손익과 하루 TCE를 계산합니다. 기본 입력값은 예시입니다.";

export const metadata: Metadata = {
  title: "항차 견적 · TCE",
  description: DESCRIPTION,
};

/** src/lib/tce.ts calculateTce와 같은 순서·같은 식 */
const FORMULA: [string, string][] = [
  ["항해 수익", "운임($/MT) × 화물량(MT)"],
  ["항해일수", "운항거리(nm) ÷ (속력(kn) × 24)"],
  ["벙커 비용", "일일 소모(MT/day) × 항해일수 × 벙커 가격($/MT)"],
  ["커미션", "항해 수익 × 커미션(%) ÷ 100"],
  ["총 비용", "벙커 비용 + 항비 + 운하 통과비 + 커미션"],
  ["항해 이익", "항해 수익 − 총 비용"],
  ["총 일수", "항해일수 + 대기일수"],
  ["TCE", "(항해 수익 − 벙커 − 항비 − 운하 − 커미션) ÷ (항해일수 + 대기일수)"],
];

/** 공백에서만 줄바꿈 — "소모(MT/day)"처럼 괄호 앞에서 단어가 끊기지 않게 토큰마다 nowrap */
function Expr({ text }: { text: string }) {
  return text.split(" ").map((token, i) => (
    <Fragment key={i}>
      {i > 0 && " "}
      <span className="whitespace-nowrap">{token}</span>
    </Fragment>
  ));
}

function Assumptions() {
  return (
    <>
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-fg">계산식</h3>
        <dl className="space-y-2 rounded-lg border border-line bg-inset p-4 text-[0.8125rem]">
          {FORMULA.map(([term, expr]) => (
            <div key={term} className="grid grid-cols-[5.5rem_1fr] gap-3">
              <dt className="text-fg-muted">{term}</dt>
              <dd className="text-fg">
                <Expr text={expr} />
              </dd>
            </div>
          ))}
        </dl>
        <p>
          모든 금액은 USD, TCE는 $/day입니다. 속력은 0보다 커야 하고, 총 일수가 0이면 TCE를 표시하지 않습니다. 계산은
          브라우저에서 입력값만으로 하며 외부 시세를 불러오지 않습니다.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-fg">현재 한계 — TCE가 실제보다 높게 나옵니다</h3>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>벙커는 항해 중에만</strong> 계산합니다. 정박·대기·하역 중 연료 소모는 0으로 봅니다.
          </li>
          <li>
            <strong>
              <span className="whitespace-nowrap">공선(ballast)</span> 구간이 없습니다.
            </strong> 적재항까지 빈 배로 가는 거리·일수·연료가 빠집니다.
          </li>
          <li>
            <strong>
              <span className="whitespace-nowrap">하역(적·양하)</span> 일수가 없습니다.
            </strong> 분모에는 항해일수와 입력한 대기일수만 들어갑니다.
          </li>
          <li>벙커 가격은 한 가지입니다. ECA 구간 MGO 구분과 CO₂ 배출량은 아직 계산하지 않습니다.</li>
        </ul>
        <p>
          공선·적재 구간 분리, 정박 중 소모, ECA MGO, CO₂를 넣는 엔진 보강은 <strong>다음 업데이트</strong>에 반영됩니다. 그 전까지는 같은
          조건끼리 비교하는 용도로 쓰세요.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-fg">입력값 · 그래프 · 해설</h3>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>기본 입력값은 모두 예시값</strong>입니다. 시장 시세나 특정 C/P 조건이 아닙니다. 거리·항비·벙커 가격은
            실제 견적 전에 직접 확인하세요.
          </li>
          <li>
            속력·벙커 가격·운임 옆 슬라이더는 같은 값을 빠르게 바꾸는 보조 입력입니다. 슬라이더 범위를 벗어난 값은 숫자 칸에
            직접 입력하세요.
          </li>
          <li>하루 연료비는 일일 소모 × 벙커 가격으로, 항해 중 하루 기준입니다.</li>
          <li>민감도 그래프는 다른 입력을 고정하고 벙커 가격만 5% 간격으로 −40%~+40% 바꿔 같은 식으로 다시 계산한 값입니다.</li>
          <li>해설 문장은 AI가 쓰지 않습니다. 벙커 비용이 항해 이익 절댓값의 30%를 넘는지에 따라 두 템플릿 중 하나를 보여 줍니다.</li>
        </ul>
      </section>
    </>
  );
}

export default function AnalyticsPage() {
  return (
    <PageShell>
      <PageHeader eyebrow="VOYAGE" title="항차 견적 · TCE" description={DESCRIPTION} assumptions={<Assumptions />} />
      <TceCalculator />
    </PageShell>
  );
}
