import { AIS_GATES } from "@/data/geo/aisAreas";
import { aggregateGates, mergeStatics, type AisPosition, type AisStatic, type GateCount } from "@/lib/ais/aggregate";
import { isRecord } from "./http";
import { SourceError, type SourceDef } from "./types";

// AIS: aisstream.io 무료 WebSocket (지시서 11.3 방식 ①).
// 서버리스 함수는 상시 연결을 유지할 수 없어, 스케줄러가 부를 때마다 짧게(기본 40초) 접속해 관심 해역 스냅샷을 모아 집계한다.
// 운영 규칙(aisstream.io/documentation, 2026-10-08 확인): 접속 후 3초 안에 구독 메시지, 브라우저 직접 연결 불허(서버 프록시만),
//   계정당 동시 연결 3, 구독 갱신 1초 1회 이하, SLA 없음, 육상 수신 기반.
// 메시지 모델(github.com/aisstream/ais-message-models type-definition.yaml):
//   {MessageType, MetaData, Message:{PositionReport:{UserID, Latitude, Longitude, Sog, Cog, …}, ShipStaticData:{UserID, ImoNumber, Name, Type, Dimension:{A,B,C,D}, …}}}
// 약관: 별도 이용약관 페이지를 찾지 못함 — 상업·공개 게시 조건은 운영자 확인 필요(docs/data-sources.md).

const WS_URL = "wss://stream.aisstream.io/v0/stream";
export const AIS_GATES_KEY = "ais.gates";
export const AIS_STATIC_KEY = "ais.static";

export interface AisGatesSnapshot {
  windowSec: number;
  messages: number;
  gates: GateCount[];
}

/** 수신 메시지 하나를 위치·정적 정보로 나눈다 */
export function readAisMessage(raw: unknown, at: string): { position?: AisPosition; static?: [string, AisStatic] } {
  if (!isRecord(raw) || !isRecord(raw.Message)) return {};
  const type = raw.MessageType;
  if (type === "PositionReport" && isRecord(raw.Message.PositionReport)) {
    const p = raw.Message.PositionReport;
    const lat = Number(p.Latitude);
    const lon = Number(p.Longitude);
    // 91·181 = 위치 사용 불가(AIS 규정)
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return {};
    return { position: { mmsi: Number(p.UserID), lat, lon, sog: Number(p.Sog), cog: Number(p.Cog), at } };
  }
  if (type === "ShipStaticData" && isRecord(raw.Message.ShipStaticData)) {
    const s = raw.Message.ShipStaticData;
    const dim = isRecord(s.Dimension) ? s.Dimension : {};
    const lengthM = (Number(dim.A) || 0) + (Number(dim.B) || 0);
    return { static: [String(s.UserID), { type: Number(s.Type), lengthM, name: String(s.Name ?? "").trim(), imo: Number(s.ImoNumber) || 0, at }] };
  }
  return {};
}

export const aisstreamSource: SourceDef = {
  id: "aisstream",
  name: "aisstream.io (AIS)",
  label: "aisstream.io",
  onRequest: false,
  sourceUrl: "https://aisstream.io/",
  provides: [AIS_GATES_KEY],
  envKeys: ["AISSTREAM_API_KEY"],
  keyHelp: "aisstream.io 가입(GitHub 로그인) 후 API 키 생성",
  availability: "ready",
  cadence: "실시간 수신 · 서버에서 수집 창(40초) 집계",
  minIntervalSec: 5 * 60,
  retryIntervalSec: 5 * 60,
  staleAfterSec: 30 * 60,
  terms: "무료 · 서버 프록시만 허용 · 상업·게시 조건 확인 필요",
  async collect({ env, now, getSnapshot }) {
    const windowSec = Number(env.AIS_WINDOW_SEC ?? 40);
    const positions: AisPosition[] = [];
    const statics: Record<string, AisStatic> = {};
    let messages = 0;

    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const ws = new WebSocket(WS_URL);
      const finish = (err?: SourceError) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        try {
          ws.close();
        } catch {}
        if (err) reject(err);
        else resolve();
      };
      const timer = setTimeout(() => finish(messages ? undefined : new SourceError("empty", `${windowSec}초 동안 수신 메시지 없음`)), windowSec * 1000);
      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            APIKey: env.AISSTREAM_API_KEY,
            BoundingBoxes: AIS_GATES.map((g) => g.box),
            FilterMessageTypes: ["PositionReport", "ShipStaticData"],
          })
        );
      };
      ws.onmessage = async (ev) => {
        const text = typeof ev.data === "string" ? ev.data : await new Response(ev.data as Blob).text();
        let json: unknown;
        try {
          json = JSON.parse(text);
        } catch {
          return;
        }
        if (isRecord(json) && typeof json.error === "string") return finish(new SourceError("auth", json.error));
        messages++;
        const r = readAisMessage(json, new Date().toISOString());
        if (r.position) positions.push(r.position);
        if (r.static) statics[r.static[0]] = r.static[1];
      };
      ws.onerror = () => finish(new SourceError("network", "WebSocket 연결 오류"));
      ws.onclose = () => finish(messages ? undefined : new SourceError("network", "수신 전에 연결이 닫힘"));
    });

    const prev = (await getSnapshot<Record<string, AisStatic>>(AIS_STATIC_KEY))?.data ?? {};
    const merged = mergeStatics(prev, statics, now);
    const fetchedAt = new Date().toISOString();
    const data: AisGatesSnapshot = { windowSec, messages, gates: aggregateGates(positions, merged, AIS_GATES) };
    return {
      snapshots: [
        { key: AIS_GATES_KEY, data, asOf: fetchedAt, fetchedAt, source: "aisstream.io", sourceUrl: "https://aisstream.io/" },
        { key: AIS_STATIC_KEY, data: merged, asOf: fetchedAt, fetchedAt, source: "aisstream.io", sourceUrl: "https://aisstream.io/" },
      ],
    };
  },
};
