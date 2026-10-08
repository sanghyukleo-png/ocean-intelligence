// 국내 주요항 ↔ 기상청 해상 특보구역 매핑 (지시서 11.4)
//
// 근거
// 1) 앞바다 구역: 국가법령정보센터 [별표 7] 「해양기상국지예보의 대상구역(제16조제3항 관련)」
//    (law.go.kr flDownload flSeq=150707027, 2026-10-08 내려받음) — 각 앞바다의 관할 시·군을 명시한다.
//    예: 울산앞바다 = 울산광역시 관할해역, 전남동부남해앞바다 = 광양시·순천시·여수시·고흥군·보성군,
//        인천·경기남부앞바다 = 인천광역시(강화군·서해5도 제외)·시흥·안산·평택·화성, 충남북부앞바다 = 서산·당진·태안·홍성.
// 2) 구역 코드: 기상특보 조회서비스 특보구역코드안내(260601) → src/data/kmaZones.ts
// 3) 연안바다·평수구역(S2): 구역명이 "○○앞바다중 …"이거나 시·군명을 포함하는 것만 이름 기준으로 붙였다.
// 4) 중기해상예보 구역: 중기예보 조회서비스 활용가이드(241128)의 중기해상예보구역 코드표.
//    앞바다의 상위 "○○전해상" 이름과 같은 해역 코드를 대응시켰다(예: 동해남부전해상 → 12C10000 동해남부).
// 5) 좌표: UN/LOCODE(2024-2 판, datasets/un-locode 미러) — 분 단위 대표 좌표로 지도 표시용. 부두·묘박지 위치가 아니다.
// 6) 단기 해상예보 구역(예보구역코드): 공공데이터포털 「기상청_예보구역정보 조회서비스」 활용가이드(240715) 해상국지 코드
//    — 날씨누리 해상 단기예보 화면의 구역 목록과 대조(2026-10-08). API허브 단기 해상예보 연결 시 이 코드로 조회한다.
// 7) 관할 기관: 각 지방해양수산청 누리집(2026-10-08 접속 확인). 제주는 지방해양수산청이 없어 비워 둔다.
//
// 항만별 실제 입출항 통제 기준(운영세칙·VTS 고시)은 확인된 것이 없어 넣지 않는다 → 화면에 "항만별 기준 확인 필요".

export interface PortZoneDef {
  id: string;
  name: string;
  /** 정유·석화 관련 항 — 목록 상단 고정 */
  refinery: boolean;
  locode: string[];
  /** [경도, 위도] — UN/LOCODE 분 단위 */
  coord: [number, number];
  /** 등급 산정에 쓰는 특보구역(앞바다 + 해당 연안·평수구역). 상위 구역은 kmaZones.zoneWithAncestors로 확장 */
  zones: string[];
  /** 중기해상예보 구역 코드 */
  midSeaRegId: string;
  /** 단기 해상예보 구역 코드(해상국지 앞바다) */
  shortSeaRegIds: string[];
  authority: { name: string; url: string } | null;
}

export const KMA_PORTS: PortZoneDef[] = [
  {
    id: "ulsan",
    name: "울산·온산",
    refinery: true,
    locode: ["KRUSN", "KRONS"],
    coord: [129.317, 35.533], // USN 3532N 12919E (ONS 3526N 12921E)
    zones: ["S1131100", "S2110200", "S2120400"],
    midSeaRegId: "12C10000",
    shortSeaRegIds: ["12C10101"],
    authority: { name: "울산지방해양수산청", url: "https://ulsan.mof.go.kr/" },
  },
  {
    id: "yeosu",
    name: "여수·광양",
    refinery: true,
    locode: ["KRYOS", "KRKAN"],
    coord: [127.717, 34.75], // YOS 3445N 12743E (KAN 3456N 12742E)
    zones: ["S1321200", "S2310800", "S2310900"],
    midSeaRegId: "12B10000",
    shortSeaRegIds: ["12B10102"],
    authority: { name: "여수지방해양수산청", url: "https://yeosu.mof.go.kr/" },
  },
  {
    id: "daesan",
    name: "대산",
    refinery: true,
    locode: ["KRTSN"],
    coord: [126.367, 37.0], // TSN 3700N 12622E
    zones: ["S1251300", "S2212200"],
    midSeaRegId: "12A20000",
    shortSeaRegIds: ["12A20103"],
    authority: { name: "대산지방해양수산청", url: "https://daesan.mof.go.kr/" },
  },
  {
    id: "incheon",
    name: "인천",
    refinery: true,
    locode: ["KRINC"],
    coord: [126.617, 37.45], // INC 3727N 12637E
    zones: ["S1251200", "S2211100", "S2211600", "S2211700"],
    midSeaRegId: "12A20000",
    shortSeaRegIds: ["12A20102"],
    authority: { name: "인천지방해양수산청", url: "https://incheon.mof.go.kr/" },
  },
  {
    id: "pyeongtaek",
    name: "평택·당진",
    refinery: false,
    locode: ["KRPTK", "KRTJI"],
    coord: [127.1, 36.967], // PTK 3658N 12706E (TJI 3658N 12647E)
    // 평택은 인천·경기남부앞바다, 당진은 충남북부앞바다 — 두 구역 중 높은 등급을 쓴다
    zones: ["S1251200", "S1251300", "S2212100"],
    midSeaRegId: "12A20000",
    shortSeaRegIds: ["12A20102", "12A20103"],
    authority: { name: "평택지방해양수산청", url: "https://pyeongtaek.mof.go.kr/" },
  },
  {
    id: "busan",
    name: "부산",
    refinery: false,
    locode: ["KRPUS"],
    coord: [129.05, 35.133], // PUS 3508N 12903E
    zones: ["S1311100", "S2310100", "S2310200", "S2320100"],
    midSeaRegId: "12B20000",
    shortSeaRegIds: ["12B20103"],
    authority: { name: "부산지방해양수산청", url: "https://busan.mof.go.kr/" },
  },
  {
    id: "pohang",
    name: "포항",
    refinery: false,
    locode: ["KRKPO"],
    coord: [129.367, 36.033], // KPO 3602N 12922E
    zones: ["S1131200", "S2110100", "S2120300"],
    midSeaRegId: "12C10000",
    shortSeaRegIds: ["12C10102"],
    authority: { name: "포항지방해양수산청", url: "https://pohang.mof.go.kr/" },
  },
  {
    id: "gunsan",
    name: "군산",
    refinery: false,
    locode: ["KRKUV"],
    coord: [126.717, 35.983], // KUV 3559N 12643E
    zones: ["S1231100", "S2210100"],
    midSeaRegId: "12A30000",
    shortSeaRegIds: ["22A30101"],
    authority: { name: "군산지방해양수산청", url: "https://gunsan.mof.go.kr/" },
  },
  {
    id: "mokpo",
    name: "목포",
    refinery: false,
    locode: ["KRMOK"],
    coord: [126.383, 34.8], // MOK 3448N 12623E
    zones: ["S1231400", "S2211300", "S2211400"],
    midSeaRegId: "12A30000",
    shortSeaRegIds: ["22A30104"],
    authority: { name: "목포지방해양수산청", url: "https://mokpo.mof.go.kr/" },
  },
  {
    id: "masan",
    name: "마산",
    refinery: false,
    locode: ["KRMAS"],
    coord: [128.567, 35.2], // MAS 3512N 12834E
    zones: ["S1311300", "S2310300", "S2320800"],
    midSeaRegId: "12B20000",
    shortSeaRegIds: ["12B20102"],
    authority: { name: "마산지방해양수산청", url: "https://masan.mof.go.kr/" },
  },
  {
    id: "donghae",
    name: "동해·묵호",
    refinery: false,
    locode: ["KRTGH", "KRMUK"],
    coord: [129.117, 37.483], // TGH 3729N 12907E (MUK 3732N 12906E)
    zones: ["S1151300", "S2120700"],
    midSeaRegId: "12C20000",
    shortSeaRegIds: ["12C20101"],
    authority: { name: "동해지방해양수산청", url: "https://donghae.mof.go.kr/" },
  },
  {
    id: "jeju",
    name: "제주",
    refinery: false,
    locode: ["KRCHA"],
    coord: [126.517, 33.5], // CHA 3330N 12631E
    zones: ["S1323100", "S2320400"],
    midSeaRegId: "12B10500",
    shortSeaRegIds: ["12B10302"],
    authority: null,
  },
];

/** 중기해상예보 구역 코드표(활용가이드 241128) 중 국내 항만에 쓰는 것 */
export const MID_SEA_REGIONS: Record<string, string> = {
  "12A20000": "서해중부",
  "12A30000": "서해남부",
  "12B10000": "남해서부",
  "12B20000": "남해동부",
  "12C10000": "동해남부",
  "12C20000": "동해중부",
  "12B10500": "제주도",
};
