import { Vessel } from "@/types";

// SIMULATED / DEMO 항로 데이터입니다. 실제 AIS 추적 정보가 아닙니다.

export interface Port {
  name: string;
  lat: number;
  lon: number;
}

const FLAG_PORTS: Record<string, Port> = {
  그리스: { name: "피레우스", lat: 37.94, lon: 23.65 },
  싱가포르: { name: "싱가포르", lat: 1.29, lon: 103.85 },
  노르웨이: { name: "베르겐", lat: 60.39, lon: 5.32 },
  브라질: { name: "산투스", lat: -23.96, lon: -46.33 },
  대한민국: { name: "부산", lat: 35.18, lon: 129.08 },
  칠레: { name: "발파라이소", lat: -33.05, lon: -71.62 },
  아랍에미리트: { name: "푸자이라", lat: 25.11, lon: 56.34 },
};

const HUB_PORTS: Port[] = [
  { name: "로테르담", lat: 51.92, lon: 4.48 },
  { name: "싱가포르", lat: 1.29, lon: 103.85 },
  { name: "푸자이라", lat: 25.11, lon: 56.34 },
  { name: "거제(한화오션)", lat: 34.88, lon: 128.62 },
  { name: "휴스턴", lat: 29.75, lon: -95.36 },
];

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

export interface VoyageRoute {
  origin: Port;
  destination: Port;
  progressPct: number;
  etaDays: number;
}

export function getDemoRoute(vessel: Vessel): VoyageRoute {
  const h = hashId(vessel.id);
  const origin = FLAG_PORTS[vessel.flag ?? ""] ?? HUB_PORTS[0];
  let destination = HUB_PORTS[h % HUB_PORTS.length];
  if (destination.name === origin.name) {
    destination = HUB_PORTS[(h + 1) % HUB_PORTS.length];
  }
  return {
    origin,
    destination,
    progressPct: 8 + (h % 84), // 8~91%
    etaDays: 2 + (h % 12),
  };
}
