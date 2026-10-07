import { TIER_LABEL_KO } from "@/lib/scoring";
import { SCORE_FACTORS, weightPct } from "@/components/opportunities/factors";
import { keepKoreanWords } from "@/components/opportunities/keep-words";

// classifyTier(scoring.ts)의 구간을 글로 옮긴 것. 등급 이름은 엔진의 TIER_LABEL_KO를 그대로 쓴다.
const TIER_BANDS = [
  `85점 이상 ${TIER_LABEL_KO["VERY HIGH"]}`,
  `70–84 ${TIER_LABEL_KO.HIGH}`,
  `50–69 ${TIER_LABEL_KO.MEDIUM}`,
  `50 미만 ${TIER_LABEL_KO.LOW}`,
];

/** PageHeader ? 패널: 점수 산정 방식 · 가정 · 한계 */
export function ScoringAssumptions() {
  const totalWeight = SCORE_FACTORS.reduce((sum, f) => sum + weightPct(f.key), 0);

  return (
    <>
      <p>
        <strong>{keepKoreanWords("점수 = 6개 요인 점수(0–100) × 가중치의 합.")}</strong>{" "}
        {keepKoreanWords("결과는 0–100 범위로 자르고 정수로 반올림합니다.")}
      </p>

      <div className="overflow-hidden rounded-lg border border-line">
        <table className="w-full text-left text-[0.8125rem]">
          <caption className="sr-only">점수 요인과 가중치</caption>
          <thead className="bg-inset text-fg-muted">
            <tr>
              <th scope="col" className="px-3 py-2 font-medium">
                요인
              </th>
              <th scope="col" className="px-3 py-2 text-right font-medium">
                가중치
              </th>
            </tr>
          </thead>
          <tbody>
            {SCORE_FACTORS.map((f) => (
              <tr key={f.key} className="border-t border-line">
                <th scope="row" className="px-3 py-2 font-normal">
                  <span className="block font-medium text-fg">{f.label}</span>
                  <span className="block text-xs text-fg-muted">{f.meaning}</span>
                </th>
                <td className="num px-3 py-2 text-right align-top text-fg">{weightPct(f.key)}%</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-line-strong">
              <th scope="row" className="px-3 py-2 font-medium text-fg-muted">
                합계
              </th>
              <td className="num px-3 py-2 text-right font-semibold text-fg">{totalWeight}%</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p>
        <strong>등급</strong>{" "}
        {TIER_BANDS.map((t, i) => (
          <span key={t}>
            {i > 0 && " · "}
            <span className="whitespace-nowrap">{t}</span>
          </span>
        ))}
        . 등급은 색과 함께 항상 글자로 표기합니다.
      </p>
      <p>
        <strong>결정론적 계산.</strong> 같은 입력이면 언제나 같은 점수가 나옵니다. 해설 문장과 영업 브리프는 템플릿이
        결과를 설명할 뿐 점수를 정하거나 바꾸지 않습니다. AI를 연결해도 설명만 맡습니다.
      </p>
      <p>
        <strong>한계.</strong>{" "}
        {keepKoreanWords(
          "고객사 이름, 선대 수치, 요인 점수는 모두 예시(가상) 데이터입니다. 실제 선대 데이터베이스와 연결되어 있지 않으며, 요인 점수의 0–100 정규화 기준도 예시값입니다."
        )}
      </p>
    </>
  );
}
