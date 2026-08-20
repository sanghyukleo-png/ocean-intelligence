import { MarketIndicator, MarketSignal } from "@/types";

// 참고: 아래 수치는 모두 포트폴리오 목적의 시뮬레이션/데모 데이터이며,
// 실제 시장 정보를 반영하지 않습니다.

export const mockMarketIndicators: MarketIndicator[] = [
  {
    id: "fleet-size",
    label: "전 세계 상선대",
    value: 105230,
    unit: "척",
    changePct: 1.8,
    direction: "up",
    sparkline: [98200, 99400, 100800, 101900, 103100, 104200, 105230],
    description: "주요 세그먼트에서 추적 중인 전체 활성 상선 척수.",
  },
  {
    id: "avg-fleet-age",
    label: "평균 선령",
    value: 13.4,
    unit: "년",
    changePct: 2.3,
    direction: "up",
    sparkline: [12.1, 12.4, 12.7, 12.9, 13.0, 13.2, 13.4],
    description: "신조 인도 속도가 해체 속도를 따라가지 못하며 선대가 노후화되고 있습니다.",
  },
  {
    id: "orderbook",
    label: "글로벌 발주잔량",
    value: 11.2,
    unit: "% (선대 대비)",
    changePct: -4.1,
    direction: "down",
    sparkline: [12.8, 12.5, 12.1, 11.8, 11.6, 11.4, 11.2],
    description: "발주잔량 대비 선대 비율이 여전히 역사적 평균을 밑돌고 있습니다.",
  },
  {
    id: "newbuilding",
    label: "신조 계약 (연초 대비)",
    value: 842,
    unit: "척",
    changePct: 6.7,
    direction: "up",
    sparkline: [610, 655, 690, 730, 770, 805, 842],
    description: "선대 교체 수요를 바탕으로 신조 계약 활동이 가속화되고 있습니다.",
  },
  {
    id: "scrapping",
    label: "해체 실적 (연초 대비)",
    value: 296,
    unit: "척",
    changePct: 12.4,
    direction: "up",
    sparkline: [180, 205, 220, 240, 258, 275, 296],
    description: "노후 선박이 가속화된 속도로 선대에서 퇴출되고 있습니다.",
  },
  {
    id: "alt-fuel",
    label: "대체연료 발주 비중",
    value: 44.6,
    unit: "%",
    changePct: 8.9,
    direction: "up",
    sparkline: [28.4, 31.2, 34.0, 37.5, 40.1, 42.3, 44.6],
    description: "LNG·메탄올·암모니아 대응 추진 방식을 명시한 신조 계약의 비중입니다.",
  },
  {
    id: "freight",
    label: "종합 운임지수",
    value: 1284,
    unit: "포인트",
    changePct: -2.6,
    direction: "down",
    sparkline: [1350, 1340, 1320, 1305, 1298, 1291, 1284],
    description: "탱커·벌커·컨테이너 세그먼트를 가중 평균한 종합 운임지수입니다.",
  },
  {
    id: "trade-activity",
    label: "해상 물동량",
    value: 12480,
    unit: "백만톤",
    changePct: 3.1,
    direction: "up",
    sparkline: [11700, 11850, 12000, 12150, 12280, 12380, 12480],
    description: "주요 상품군을 합산한 연환산 해상 물동량입니다.",
  },
];

export const mockMarketSignals: MarketSignal[] = [
  {
    id: "signal-fleet-renewal",
    title: "선대 교체 시기 확대",
    direction: "up",
    importance: "high",
    segment: "탱커 / 벌커",
    summary:
      "평균 선령이 13년을 넘어서는 가운데 발주잔량 비율이 12% 아래로 내려가면서, 신조 결정을 미뤄온 선주들의 교체 사이클이 가속화되고 있음을 시사합니다.",
  },
  {
    id: "signal-alt-fuel",
    title: "대체연료 전환 가속화",
    direction: "up",
    importance: "high",
    segment: "전 세그먼트",
    summary:
      "신조 계약의 절반에 가까운 비중이 대체연료 대응 추진 방식을 명시하고 있으며, 이는 IMO 배출규제 강화 시점을 앞두고 나타나는 현상입니다.",
  },
  {
    id: "signal-tanker-demand",
    title: "탱커 수요 견조",
    direction: "up",
    importance: "medium",
    segment: "MR / LR 탱커",
    summary:
      "정제유 해상 물동량이 증가하는 반면, MR 세그먼트의 가용 신형 선복은 여전히 타이트한 상황입니다.",
  },
  {
    id: "signal-orderbook-pressure",
    title: "조선소 발주잔량 압박",
    direction: "up",
    importance: "medium",
    segment: "전 세그먼트",
    summary:
      "신조 계약 속도가 조선소 슬롯 확보 속도를 앞지르면서 인도 시점이 늘어나고 있어, 조기 상업적 접근이 유리한 국면입니다.",
  },
  {
    id: "signal-scrapping-cycle",
    title: "해체 사이클 상승 전환",
    direction: "up",
    importance: "medium",
    segment: "벌커 / 탱커",
    summary:
      "규제 시한을 앞두고 노후·저효율 선박을 퇴출하는 선주들이 늘면서 연초 대비 해체 활동이 가속화되고 있습니다.",
  },
  {
    id: "signal-freight-softening",
    title: "운임 소폭 약세",
    direction: "down",
    importance: "low",
    segment: "종합",
    summary:
      "종합 운임지수가 소폭 완화되었으나, 구조적인 선대 교체 수요에 비하면 부차적인 요인입니다.",
  },
];
