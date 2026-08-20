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
        purpose="항해 조건을 입력하면 정기용선환산료(TCE)를 즉시 계산합니다."
        howItWorks="입력값을 바꾸면 결과와 그래프가 바로 갱신됩니다."
      />

      <TceCalculator />
    </div>
  );
}
