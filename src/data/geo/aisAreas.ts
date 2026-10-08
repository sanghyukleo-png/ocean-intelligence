// AIS 집계 해역(지시서 11.3) — 초크포인트 통과 척수를 세는 "본 사이트 정의 집계 상자".
// 공식 경계가 아니다. 해협의 가장 좁은 구간을 덮도록 위경도 상자로 잡았고 화면에 "집계 상자 정의"로 노출한다.
// 방향은 대지침로(COG) 구간으로 나눈다 — 통항분리방식(TSS)의 실제 항로 방향을 단순화한 추정이다.
//
// 국내 항만 묘박지·항내 폴리곤은 해양수산부 고시(무역항 항계 안의 정박지 좌표)로 확인한 뒤 추가한다 — 아직 미반영.

export interface AisGate {
  id: string;
  name: string;
  /** [남서 [위도, 경도], 북동 [위도, 경도]] — aisstream BoundingBoxes 형식과 같은 순서 */
  box: [[number, number], [number, number]];
  /** COG가 [from, to) 구간(시계 방향, 360 넘김 허용)이면 이 방향 */
  directions: { id: string; label: string; from: number; to: number }[];
}

export const AIS_GATES: AisGate[] = [
  {
    id: "hormuz",
    name: "호르무즈 해협",
    box: [
      [26.0, 55.9],
      [26.9, 57.0],
    ],
    directions: [
      { id: "in", label: "걸프 방향", from: 180, to: 360 },
      { id: "out", label: "오만만 방향", from: 0, to: 180 },
    ],
  },
  {
    id: "singapore",
    name: "싱가포르 해협",
    box: [
      [1.05, 103.55],
      [1.4, 104.4],
    ],
    directions: [
      { id: "east", label: "남중국해 방향", from: 0, to: 180 },
      { id: "west", label: "말라카 방향", from: 180, to: 360 },
    ],
  },
  {
    id: "korea-strait",
    name: "대한해협",
    box: [
      [34.2, 128.6],
      [35.1, 129.9],
    ],
    directions: [
      { id: "ne", label: "동해 방향", from: 315, to: 495 }, // 315~360 + 0~135
      { id: "sw", label: "동중국해 방향", from: 135, to: 315 },
    ],
  },
];
