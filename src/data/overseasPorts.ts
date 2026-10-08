// 해외 항만 프리셋(지시서 5.6) — 정유·석화 수출입 관련 항.
// 좌표: UN/LOCODE(2024-2 판, datasets/un-locode 미러) 분 단위 대표 좌표. 부두·묘박지 위치가 아니다.
// 지바(JPCHB)는 UN/LOCODE에 좌표가 없어 검증할 수 없으므로 넣지 않고, 유럽 제품 시장인 로테르담을 둔다.

export interface OverseasPort {
  id: string;
  name: string;
  country: string;
  locode: string;
  /** [경도, 위도] */
  coord: [number, number];
  /** 현지 시간대(IANA) — 표시용 */
  tz: string;
}

export const OVERSEAS_PORTS: OverseasPort[] = [
  { id: "singapore", name: "싱가포르", country: "싱가포르", locode: "SGSIN", coord: [103.85, 1.283], tz: "Asia/Singapore" }, // 0117N 10351E
  { id: "ningbo", name: "닝보·저우산", country: "중국", locode: "CNNBG", coord: [121.667, 29.917], tz: "Asia/Shanghai" }, // 2955N 12140E
  { id: "qingdao", name: "칭다오", country: "중국", locode: "CNQIN", coord: [120.317, 36.05], tz: "Asia/Shanghai" }, // 3603N 12019E
  { id: "fujairah", name: "푸자이라", country: "UAE", locode: "AEFJR", coord: [56.333, 25.117], tz: "Asia/Dubai" }, // 2507N 05620E
  { id: "ras-tanura", name: "라스타누라", country: "사우디", locode: "SARTA", coord: [50.15, 26.633], tz: "Asia/Riyadh" }, // 2638N 05009E
  { id: "rotterdam", name: "로테르담", country: "네덜란드", locode: "NLRTM", coord: [4.5, 51.917], tz: "Europe/Amsterdam" }, // 5155N 00430E
];
