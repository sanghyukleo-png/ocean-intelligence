import { zoneName, zoneWithAncestors } from "@/data/kmaZones";
import type { PortZoneDef } from "@/data/kmaPortZones";
import type { ActiveWarning, PreliminaryWarning, WarningStatus } from "@/lib/kma/warnings";
import type { RiskLevel } from "@/lib/tokens";

// 국내항 클로징 위험도 — 결정론적 규칙(지시서 11.4). 공식 입출항 통제가 아니라 기상청 특보·예보에 근거한 추정이다.
//
// 등급(기본값, 설정에서 수정 가능)
//   4 통제 중 가능성 높음  풍랑경보·태풍경보·태풍주의보 발효
//   3 높음               풍랑주의보 발효, 또는 24시간 내 풍랑·태풍 예비특보
//   2 주의               48시간 내 예비특보, 또는 단기 해상예보 풍속·파고가 사용자 임계값 초과, 또는 안개(저시정)
//   1 관찰               중기해상예보(3~10일) 높은 파고, 또는 태풍 예상 진로가 한반도 인근
//   0 정상               해당 없음
//
// 특보 발표 기준(기상청 「기상특보 종류와 발표기준」 weather.go.kr/kma/biz/forecast03.jsp, 2026-10-08 확인)
//   풍랑주의보  해상에서 풍속 14m/s 이상이 3시간 이상 지속되거나 유의파고가 3m 이상 예상될 때
//   풍랑경보    해상에서 풍속 21m/s 이상이 3시간 이상 지속되거나 유의파고가 5m 이상 예상될 때
//   태풍주의보  태풍으로 인하여 강풍·풍랑·호우·폭풍해일 현상이 주의보 기준에 도달할 것으로 예상될 때
//   태풍경보    태풍으로 인하여 강풍·풍랑·폭풍해일이 경보 기준에 도달하거나 총 강우량 200mm 이상 예상될 때
export const KMA_CRITERIA = {
  advisory: { windMs: 14, waveM: 3 },
  warning: { windMs: 21, waveM: 5 },
} as const;

/** 1 m/s = 1.943844 kn (1 kn = 1852 m/h, 국제 해리 정의) */
export const MS_TO_KT = 3600 / 1852;

export interface RiskThresholds {
  /** 단기예보 풍속 임계값(kn) — 지시서 5.6 기본 예 25kt */
  windKt: number;
  /** 단기예보 파고 임계값(m) — 지시서 5.6 기본 예 2.0m */
  waveM: number;
  /** 중기해상예보 "높은 파고" 기준(m) — 기본은 풍랑주의보 파고 기준 3m */
  midWaveM: number;
  /** 예비특보 → 높음 승격 시간(h) */
  preliminaryHighH: number;
  /** 예비특보 → 주의 시간(h) */
  preliminaryCautionH: number;
}

export const DEFAULT_THRESHOLDS: RiskThresholds = {
  windKt: 25,
  waveM: 2.0,
  midWaveM: KMA_CRITERIA.advisory.waveM,
  preliminaryHighH: 24,
  preliminaryCautionH: 48,
};

export type VesselSize = "small" | "large";

/** 단기 해상예보 한 시점(기상청 API허브 연결 후 채움) */
export interface ShortTermPoint {
  at: string;
  windKt?: number;
  waveM?: number;
  /** 안개·저시정 예보 */
  fog?: boolean;
}

export interface MidSeaDay {
  date: string;
  waveMaxM: number;
}

/** 소스별 입력 — ok가 아니면 "수집 실패"이지 "없음"이 아니다 */
export type Feed<T> =
  | { state: "ok"; data: T; asOf: string; fetchedAt: string }
  | { state: "failed"; lastSuccessAt: string | null; error: string }
  | { state: "nokey" }
  | { state: "unavailable"; reason: string };

export interface PortRiskInput {
  now: Date;
  port: PortZoneDef;
  warnings: Feed<WarningStatus>;
  shortTerm?: Feed<ShortTermPoint[]>;
  midSea?: Feed<MidSeaDay[]>;
  typhoonNear?: Feed<boolean>;
  thresholds?: RiskThresholds;
  vesselSize?: VesselSize;
}

export interface RiskReason {
  level: RiskLevel;
  text: string;
  /** 근거 시각들 */
  announcedAt?: string;
  validFrom?: string | null;
  zone?: string;
  source: "특보" | "예비특보" | "단기예보" | "중기예보" | "태풍";
}

export interface PortRisk {
  portId: string;
  /** null = 산출 불가(수집 실패·키 미설정) — "정상"으로 표시하지 않는다 */
  level: RiskLevel | null;
  reasons: RiskReason[];
  /** 0–24h · 24–48h · 48–72h 전망 */
  horizon: [RiskLevel | null, RiskLevel | null, RiskLevel | null];
  /** 중기(3~10일) */
  mid: RiskLevel | null;
  failure: { kind: "failed"; lastSuccessAt: string | null; error: string } | { kind: "nokey" } | null;
  /** 보조 입력이 빠져 판단 범위가 줄어든 항목 */
  gaps: string[];
  sizeNote: string;
}

const H = 3600_000;
const MARINE = new Set(["풍랑", "태풍"]);

function activeLevel(w: ActiveWarning): RiskLevel | null {
  if (w.kind === "태풍") return 4;
  if (w.kind === "풍랑") return w.level === "주의보" ? 3 : 4;
  return null;
}

function prelimLevel(hoursAhead: number, t: RiskThresholds): RiskLevel | null {
  if (hoursAhead <= t.preliminaryHighH) return 3;
  if (hoursAhead <= t.preliminaryCautionH) return 2;
  return null;
}

const max = (a: RiskLevel | null, b: RiskLevel | null): RiskLevel | null => (a === null ? b : b === null ? a : (Math.max(a, b) as RiskLevel));

export function portZoneSet(port: PortZoneDef): Set<string> {
  return new Set(port.zones.flatMap(zoneWithAncestors));
}

export function evaluatePortRisk(input: PortRiskInput): PortRisk {
  const { now, port, warnings } = input;
  const t = input.thresholds ?? DEFAULT_THRESHOLDS;
  const sizeNote =
    input.vesselSize === "small"
      ? "소형선은 같은 특보에서도 먼저 통제되는 경우가 많습니다. 실제 기준은 항만별 운영세칙·VTS 공지를 확인하십시오."
      : "대형선의 입출항 제한 기준은 항만·터미널마다 다릅니다. 항만별 기준 확인 필요.";
  const gaps: string[] = [];
  const base: Omit<PortRisk, "level" | "reasons" | "horizon" | "mid" | "failure"> = { portId: port.id, gaps, sizeNote };

  // 특보가 핵심 입력 — 없으면 등급을 내지 않는다
  if (warnings.state !== "ok") {
    const failure =
      warnings.state === "failed"
        ? { kind: "failed" as const, lastSuccessAt: warnings.lastSuccessAt, error: warnings.error }
        : { kind: "nokey" as const };
    return { ...base, level: null, reasons: [], horizon: [null, null, null], mid: null, failure };
  }

  const zones = portZoneSet(port);
  const reasons: RiskReason[] = [];
  const horizon: PortRisk["horizon"] = [0, 0, 0];
  const status = warnings.data;

  // 1) 발효 중 특보 — 해제 시점은 통보문 원문(해제 예고)로만 알 수 있어 72시간 전망까지 유지(보수적)
  const seen = new Set<string>();
  for (const w of status.active) {
    if (!zones.has(w.zoneCode) || !MARINE.has(w.kind)) continue;
    const lvl = activeLevel(w);
    if (lvl === null) continue;
    const k = `${w.kind}${w.level}|${w.zoneCode}`;
    if (seen.has(k)) continue;
    seen.add(k);
    reasons.push({
      level: lvl,
      source: "특보",
      text: `${w.kind}${w.level} 발효 중 — ${zoneName(w.zoneCode)}`,
      announcedAt: status.announcedAt,
      validFrom: w.since,
      zone: zoneName(w.zoneCode),
    });
    for (let i = 0; i < 3; i++) horizon[i] = max(horizon[i], lvl);
  }

  // 2) 예비특보 — 발효 예상까지 남은 시간으로 등급
  const prelimSeen = new Set<string>();
  for (const p of status.preliminary as PreliminaryWarning[]) {
    if (!zones.has(p.zoneCode)) continue;
    const hours = (new Date(p.expectedAt).getTime() - now.getTime()) / H;
    const marine = MARINE.has(p.kind);
    // 24시간 내 승격은 풍랑·태풍만, 48시간 내 주의는 모든 예비특보(지시서 11.4 표)
    let lvl = prelimLevel(Math.max(0, hours), t);
    if (lvl === 3 && !marine) lvl = 2;
    if (lvl === null) continue;
    const k = `${p.kind}|${p.zoneCode}|${p.expectedAt}`;
    if (prelimSeen.has(k)) continue;
    prelimSeen.add(k);
    reasons.push({
      level: lvl,
      source: "예비특보",
      text: `${p.kind} 예비특보 — ${p.timeText}${p.timeApprox ? "(시간 표현 미해석, 그날 00시로 계산)" : ""} · ${zoneName(p.zoneCode)}`,
      announcedAt: status.announcedAt,
      validFrom: p.expectedAt,
      zone: zoneName(p.zoneCode),
    });
    // 발효 예상 시각이 속한 전망 구간부터 반영
    const idx = Math.min(2, Math.max(0, Math.floor(Math.max(0, hours) / 24)));
    const effLvl: RiskLevel = marine ? 3 : 2;
    horizon[idx] = max(horizon[idx], effLvl);
    for (let i = idx + 1; i < 3; i++) horizon[i] = max(horizon[i], effLvl);
  }
  horizon[0] = max(horizon[0], reasons.filter((r) => r.source === "예비특보").reduce<RiskLevel | null>((a, r) => max(a, r.level), null));

  // 3) 단기 해상예보 임계값
  const st = input.shortTerm;
  if (!st || st.state !== "ok") gaps.push("단기 해상예보 미연결 — 풍속·파고 임계값 판단 제외");
  else {
    for (const pt of st.data) {
      const hours = (new Date(pt.at).getTime() - now.getTime()) / H;
      if (hours < 0 || hours >= 72) continue;
      const over: string[] = [];
      if (pt.windKt !== undefined && pt.windKt >= t.windKt) over.push(`풍속 ${pt.windKt.toFixed(0)}kt ≥ ${t.windKt}kt`);
      if (pt.waveM !== undefined && pt.waveM >= t.waveM) over.push(`파고 ${pt.waveM.toFixed(1)}m ≥ ${t.waveM}m`);
      if (pt.fog) over.push("안개(저시정)");
      if (!over.length) continue;
      const idx = Math.floor(hours / 24);
      horizon[idx] = max(horizon[idx], 2);
      if (idx === 0) reasons.push({ level: 2, source: "단기예보", text: `단기 해상예보 ${over.join(", ")}`, announcedAt: st.asOf, validFrom: pt.at });
    }
  }

  // 4) 중기해상예보(3~10일)
  let mid: RiskLevel | null = null;
  const ms = input.midSea;
  if (!ms || ms.state !== "ok") gaps.push("중기해상예보 미수집 — 3~10일 전망 제외");
  else {
    mid = 0;
    const high = ms.data.filter((d) => d.waveMaxM >= t.midWaveM);
    if (high.length) {
      mid = 1;
      reasons.push({
        level: 1,
        source: "중기예보",
        text: `중기해상예보 최고 파고 ${Math.max(...high.map((d) => d.waveMaxM))}m (${high.map((d) => d.date.slice(5)).join(", ")})`,
        announcedAt: ms.asOf,
      });
    }
  }

  // 5) 태풍 예상 진로
  const ty = input.typhoonNear;
  if (!ty || ty.state !== "ok") gaps.push("태풍 정보 미연결");
  else if (ty.data) {
    mid = max(mid, 1);
    reasons.push({ level: 1, source: "태풍", text: "태풍 예상 진로가 한반도 인근", announcedAt: ty.asOf });
  }

  const current = reasons.filter((r) => r.source !== "중기예보" && r.source !== "태풍").reduce<RiskLevel>((a, r) => Math.max(a, r.level) as RiskLevel, 0);
  const level = max(current, mid === 1 ? 1 : 0)!;
  reasons.sort((a, b) => b.level - a.level);
  return { ...base, level, reasons, horizon, mid, failure: null };
}
