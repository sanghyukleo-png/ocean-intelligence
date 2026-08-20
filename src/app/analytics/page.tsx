import { Calculator } from "lucide-react";
import { TceCalculator } from "@/components/tce-calculator";
import { PageIntro } from "@/components/page-intro";

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      <PageIntro
        icon={Calculator}
        eyebrow="항해 경제성"
        title="분석"
        purpose="화물량·운항거리·연료소모량·항비 등 항해 조건을 입력하면 정기용선환산료(TCE, $/일)를 즉시 계산하고, 벙커유 가격 변동에 따른 민감도를 그래프로 보여줍니다."
        howItWorks="TCE = (항해 수익 − 항해 비용) ÷ 총 항해일수 공식을 순수 TypeScript 연산으로 계산하며 LLM은 전혀 사용하지 않습니다. 좌측 입력값과 슬라이더를 움직이면 우측 결과와 민감도 차트가 실시간으로 갱신됩니다 — 직접 값을 바꿔가며 테스트해보세요."
      />

      <TceCalculator />
    </div>
  );
}
