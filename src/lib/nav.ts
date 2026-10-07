import {
  CalendarClock,
  ChartLine,
  Gauge,
  Columns3,
  Factory,
  FileScan,
  FlaskConical,
  Hourglass,
  Info,
  Route,
  Scale,
  Ship,
  Waves,
  type LucideIcon,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────
// 정보 구조(지시서 4.2)의 단일 원천. 헤더·메가메뉴·모바일 탭·⌘K·푸터·홈 도구 스트립이 모두 여기서 읽는다.
// status: ready = 작동하는 화면 / soon = 해당 Phase에서 제공 (링크는 진행 현황 페이지로)
// ─────────────────────────────────────────────────────────────────────

export type NavStatus = "ready" | "soon";

export interface NavItem {
  href: string;
  label: string;
  /** 영문 보조 이름 (⌘K 검색·메가메뉴) */
  en: string;
  description: string;
  icon: LucideIcon;
  status: NavStatus;
  /** soon일 때 제공 예정 Phase */
  phase?: string;
  /** ⌘K 검색 키워드 */
  keywords?: string[];
}

export const OPS_TOOLS: NavItem[] = [
  {
    href: "/ops/laytime",
    label: "Laytime · 체선료",
    en: "Laytime & Demurrage",
    description: "SOF 시각으로 레이타임·체선료 정산서",
    icon: Hourglass,
    status: "soon",
    phase: "Phase 3",
    keywords: ["laytime", "demurrage", "레이타임", "체선료", "sof", "nor", "정산"],
  },
  {
    href: "/ops/freight",
    label: "운임",
    en: "Freight",
    description: "Worldscale · Lumpsum · $/MT 환산과 안 비교",
    icon: Ship,
    status: "soon",
    phase: "Phase 3",
    keywords: ["freight", "worldscale", "ws", "lumpsum", "운임", "deadfreight"],
  },
  {
    href: "/ops/netback",
    label: "넷백 · 아비트라지",
    en: "Netback & Arbitrage",
    description: "도착지별 FOB 넷백과 손익분기 운임",
    icon: Scale,
    status: "soon",
    phase: "Phase 5",
    keywords: ["netback", "arbitrage", "넷백", "아비트라지", "fob", "cfr"],
  },
  {
    href: "/ops/quantity",
    label: "수량·가격 환산",
    en: "Quantity & Price",
    description: "API·밀도·VCF, bbl↔MT, 가격 단위 환산",
    icon: FlaskConical,
    status: "soon",
    phase: "Phase 5",
    keywords: ["vcf", "api", "density", "bbl", "환산", "밀도", "수량"],
  },
  {
    href: "/ops/schedule",
    label: "딜 타임라인",
    en: "Deal Schedule",
    description: "노미네이션·L/C·가격 산정·결제 일정과 서류",
    icon: CalendarClock,
    status: "soon",
    phase: "Phase 5",
    keywords: ["schedule", "lc", "l/c", "nomination", "일정", "서류", "pricing"],
  },
  {
    href: "/ops/weather",
    label: "국내항 클로징 위험도",
    en: "Port Weather Risk",
    description: "기상청 특보·예보 기반 항만별 위험 등급",
    icon: Waves,
    status: "soon",
    phase: "Phase 2.5",
    keywords: ["weather", "기상", "특보", "풍랑", "태풍", "클로징", "항만"],
  },
  {
    href: "/ops/route",
    label: "항로 · 아비트라지 맵",
    en: "Route Map",
    description: "지도에서 리드타임·운임·넷백 동시 비교",
    icon: Route,
    status: "soon",
    phase: "Phase 5",
    keywords: ["route", "map", "항로", "리드타임", "거리", "수에즈"],
  },
];

export const VESSEL_ITEMS: NavItem[] = [
  {
    href: "/vessels",
    label: "Q88 분석",
    en: "Vessels · Q88",
    description: "선박 제원 텍스트에서 핵심 필드 추출",
    icon: FileScan,
    status: "ready",
    keywords: ["q88", "vessel", "선박", "제원", "imo"],
  },
  {
    href: "/compare",
    label: "선박 비교",
    en: "Compare",
    description: "2~4척 제원 비교",
    icon: Columns3,
    status: "ready",
    keywords: ["compare", "비교"],
  },
];

export const VOYAGE_ITEM: NavItem = {
  href: "/analytics",
  label: "항차 견적 · TCE",
  en: "Voyage Estimate",
  description: "운임·벙커·항비로 일일 TCE 계산",
  icon: Gauge,
  status: "ready",
  keywords: ["tce", "voyage", "항차", "견적", "벙커"],
};

export const MARKET_ITEM: NavItem = {
  href: "/market",
  label: "시황",
  en: "Market",
  description: "유가·환율·운임 지표와 뉴스",
  icon: ChartLine,
  status: "ready",
  keywords: ["market", "시황", "유가", "환율", "brent", "scfi"],
};

export const SHIPBUILDING_ITEMS: NavItem[] = [
  {
    href: "/opportunities",
    label: "조선 영업기회",
    en: "Shipbuilding Opportunities",
    description: "선대·발주잔량 기반 고객사 점수",
    icon: Factory,
    status: "ready",
    keywords: ["shipbuilding", "opportunity", "조선", "영업기회", "스코어"],
  },
];

export const ABOUT_ITEM: NavItem = {
  href: "/about",
  label: "소개",
  en: "About",
  description: "프로젝트와 설계 원칙",
  icon: Info,
  status: "ready",
  keywords: ["about", "소개"],
};

/** 데스크톱 상단 내비 순서 (지시서 4.2) */
export type TopNavEntry =
  | { kind: "menu"; id: "ops" | "shipbuilding"; label: string; items: NavItem[] }
  | { kind: "link"; item: NavItem; label: string; match: string[] };

export const TOP_NAV: TopNavEntry[] = [
  { kind: "menu", id: "ops", label: "오퍼레이션", items: OPS_TOOLS },
  { kind: "link", item: VESSEL_ITEMS[0], label: "선박", match: ["/vessels", "/compare"] },
  { kind: "link", item: VOYAGE_ITEM, label: "항차", match: ["/analytics"] },
  { kind: "link", item: MARKET_ITEM, label: "시황", match: ["/market"] },
  { kind: "menu", id: "shipbuilding", label: "조선영업", items: SHIPBUILDING_ITEMS },
];

/** 홈 도구 스트립 (지시서 4.1-5) */
export const HOME_TOOL_STRIP: NavItem[] = [
  OPS_TOOLS[0],
  OPS_TOOLS[1],
  OPS_TOOLS[2],
  OPS_TOOLS[3],
  OPS_TOOLS[4],
  VESSEL_ITEMS[0],
];

export const ALL_NAV_ITEMS: NavItem[] = [
  ...OPS_TOOLS,
  ...VESSEL_ITEMS,
  VOYAGE_ITEM,
  MARKET_ITEM,
  ...SHIPBUILDING_ITEMS,
  ABOUT_ITEM,
];

export function isActive(pathname: string, prefixes: string[]) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));
}
