import { MarketSignal, SalesBrief, ScoredOpportunity } from "@/types";
import { TIER_LABEL_KO } from "@/lib/scoring";

// 결정론적 "AI 영업 브리프" 생성기. 실제 제품에서는 AIProvider.generateSalesBrief()를
// 호출하지만, 아래 템플릿은 외부 API 키 없이도 제품이 처음부터 끝까지 동작하도록 하는
// 명시적 데모/폴백 경로입니다 (프로젝트의 데모 모드 요구사항에 따름).

export function generateSalesBrief(o: ScoredOpportunity, signals: MarketSignal[]): SalesBrief {
  const topSignals = signals.filter((s) => s.importance !== "low").slice(0, 3);
  const tierKo = TIER_LABEL_KO[o.tier];

  const executiveSummary = `${o.customer}(${o.country})는 ${o.segment} 세그먼트에서 ${tierKo} 등급(${o.score}/100)의 상업적 기회를 보이며, 평균 선령 ${o.averageFleetAge.toFixed(
    1
  )}년과 ${o.fleetSize}척 선대 대비 ${o.orderbook}척에 불과한 발주잔량이 핵심 근거입니다.`;

  const keyFindings = [
    `선대: ${o.fleetSize}척, 평균 선령 ${o.averageFleetAge.toFixed(1)}년.`,
    `발주잔량 커버리지: ${o.orderbook}척 (격차 점수 ${o.factors.orderbookGap}/100).`,
    `선대 성장 추세: 전년 대비 ${o.fleetGrowthPct >= 0 ? "+" : ""}${o.fleetGrowthPct.toFixed(1)}%.`,
    `대체연료 전환 비율: 선대의 ${o.fuelTransitionPct}%.`,
  ];

  const commercialAssessment =
    o.tier === "VERY HIGH" || o.tier === "HIGH"
      ? `노후 선대와 제한적인 신조 커버리지가 맞물려, 단기 내 선대 교체 의사결정 창이 열려 있는 것으로 판단됩니다. 가격 경쟁력만으로는 부족하며, 라이프사이클 경제성과 규제 대응 준비도를 중심으로 접근하는 편이 더 효과적일 것으로 보입니다.`
      : `현재 선대 펀더멘털은 임박한 신조 트리거를 시사하지 않습니다. 이 계정은 즉각적인 상업적 접근보다는 관계 육성과 주기적인 시그널 모니터링에 더 적합합니다.`;

  const customerOpportunity = `${o.customer}는 ${tierKo.toLowerCase()} 수준의 선대 교체 잠재력을 보이고 있습니다. 핵심 시그널: ${o.signals.join(", ")}.`;

  const talkingPoints =
    o.tier === "VERY HIGH" || o.tier === "HIGH"
      ? [
          "노후 선박의 계속 운항 대비 신조 전환의 라이프사이클 경제성",
          "현재 운임 여건 하에서의 연료 효율 및 벙커유 가격 민감도",
          "강화되는 배출규제를 앞둔 규제 대응 준비도",
          "조선소 발주잔량 타이트화에 따른 인도 슬롯 확보 여력",
        ]
      : [
          "장기 선대 전략 및 교체 타임라인",
          "운임·발주잔량·연료전환 추세에 대한 시장 모니터링",
        ];

  const relevantSignalNote = topSignals.length
    ? ` 시장 배경: ${topSignals.map((s) => s.title).join("; ")}.`
    : "";

  return {
    customer: o.customer,
    generatedAt: new Date().toISOString(),
    executiveSummary: executiveSummary + relevantSignalNote,
    keyFindings,
    commercialAssessment,
    customerOpportunity,
    talkingPoints,
    recommendedNextAction: o.recommendedAction,
  };
}
