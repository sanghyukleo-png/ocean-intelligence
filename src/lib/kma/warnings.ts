import { zoneCodeByName } from "@/data/kmaZones";

// 기상청 특보 현황 해석(순수 함수). 명세: 기상특보 조회서비스 활용가이드(2026-06-01판)
//   특보현황조회 getPwnStatus → tmFc(발표), tmEf(특보발효현황 시각), t6(특보발효현황 내용), t7(예비특보 발효현황), other
//   특보코드조회 getPwnCd → areaCode, warnVar(1 강풍·2 호우·3 한파·4 건조·5 폭풍해일·6 풍랑·7 태풍·8 대설·9 황사·12 폭염·13 열대야),
//     warnStress(0 주의보·1 경보·2 중대경보), command(1 발표·2 해제·3 연장·6 정정·7 변경발표·8 변경해제),
//     startTime(발표 시 발효시각), endTime(해제 시 발효시각), cancel(0 정상·1 취소)
// 통보문 예(가이드 원문):
//   t6  "o 풍랑주의보 : 남해동부먼바다, 동해중부먼바다, 동해남부먼바다"
//   t7  "(1) 풍랑 예비특보 o 06월 07일 아침 : 동해중부앞바다, 동해남부앞바다(경북북부앞바다, 경북남부앞바다)"
//   괄호는 상위 구역 중 괄호 안 하위 구역에만 해당한다는 뜻.

export type WarningKind = "강풍" | "호우" | "한파" | "건조" | "폭풍해일" | "풍랑" | "태풍" | "대설" | "황사" | "폭염" | "열대야";
export type WarningLevel = "주의보" | "경보" | "중대경보";

const KINDS: WarningKind[] = ["폭풍해일", "열대야", "강풍", "호우", "한파", "건조", "풍랑", "태풍", "대설", "황사", "폭염"];
const WARN_VAR: Record<number, WarningKind> = { 1: "강풍", 2: "호우", 3: "한파", 4: "건조", 5: "폭풍해일", 6: "풍랑", 7: "태풍", 8: "대설", 9: "황사", 12: "폭염", 13: "열대야" };
const STRESS: Record<number, WarningLevel> = { 0: "주의보", 1: "경보", 2: "중대경보" };

export interface ActiveWarning {
  zoneCode: string;
  kind: WarningKind;
  level: WarningLevel;
  /** 발효 시각(ISO) — 특보코드조회로 확인된 경우만 */
  since: string | null;
}

export interface PreliminaryWarning {
  zoneCode: string;
  kind: WarningKind;
  /** 발효 예상 시작(ISO) — 시간 표현의 가장 이른 해석 */
  expectedAt: string;
  /** 원문 시간 표현 (예: "10월 08일 밤") */
  timeText: string;
  /** 시간 표현을 해석하지 못해 그날 00시로 둔 경우 */
  timeApprox: boolean;
}

export interface WarningStatus {
  /** 발표 시각(ISO) */
  announcedAt: string;
  /** 특보발효현황 기준 시각(ISO) */
  effectiveAt: string | null;
  active: ActiveWarning[];
  preliminary: PreliminaryWarning[];
  /** 통보문 원문(근거 노출용) */
  raw: { t6: string; t7: string; other: string };
}

/** 최상위 쉼표로 나눈다(괄호 안 쉼표는 유지) */
function splitTop(list: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of list) {
    if (ch === "(") depth++;
    if (ch === ")") depth = Math.max(0, depth - 1);
    if (ch === "," && depth === 0) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim()).filter(Boolean);
}

/** "동해남부앞바다(경북북부앞바다, 경북남부앞바다)" → 하위 구역 코드들. 해상 구역이 아니면 빈 배열 */
export function zonesFromList(list: string): string[] {
  const codes: string[] = [];
  for (const item of splitTop(list)) {
    const m = item.match(/^([^()]+?)\s*(?:\(([^)]*)\))?$/);
    if (!m) continue;
    const [, head, inner] = m;
    const names = inner ? inner.split(",") : [head];
    for (const n of names) {
      const code = zoneCodeByName(n.trim());
      if (code) codes.push(code);
    }
  }
  return codes;
}

const clean = (s: string) => s.replace(/\s+/g, " ").trim();

/** t6 "o 풍랑주의보 : …" → 발효 중 특보 */
export function parseActive(t6: string): Omit<ActiveWarning, "since">[] {
  const out: Omit<ActiveWarning, "since">[] = [];
  const text = clean(t6);
  if (!text || /^o?\s*없음$/.test(text)) return out;
  const re = /o\s*([가-힣]+?)(중대경보|주의보|경보)\s*:\s*(.+?)(?=\s+o\s*[가-힣]+?(?:중대경보|주의보|경보)\s*:|$)/g;
  for (const m of text.matchAll(re)) {
    const kind = KINDS.find((k) => k === m[1]);
    if (!kind) continue;
    for (const zoneCode of zonesFromList(m[3])) out.push({ zoneCode, kind, level: m[2] as WarningLevel });
  }
  return out;
}

// 기상청 예보용어 시간범주(kma.go.kr/kma/biz/forecast05.jsp): 4등분 새벽 00–06·오전 06–12·오후 12–18·밤 18–24,
// 8등분 이른 새벽 00–03·늦은 새벽 03–06·아침 06–09·오전 09–12·낮 12–15·늦은 오후 15–18·저녁 18–21·늦은 밤 21–24.
// 같은 말이 두 범주에 걸치면(오전·밤) 위험 판단이 늦어지지 않도록 더 이른 시작을 쓴다. 긴 표현부터 맞춘다.
const TIME_WORDS: [string, number][] = [
  ["이른 새벽", 0],
  ["늦은 새벽", 3],
  ["늦은 오후", 15],
  ["오후 늦게", 15],
  ["늦은 밤", 21],
  ["밤늦게", 21],
  ["자정 무렵", 23],
  ["새벽", 0],
  ["아침", 6],
  ["오전", 6],
  ["낮", 12],
  ["오후", 12],
  ["저녁", 18],
  ["밤", 18],
];

export function timeWordStartHour(text: string): number | null {
  const t = text.replace(/\s+/g, " ").trim();
  for (const [word, hour] of TIME_WORDS) if (t.startsWith(word)) return hour;
  return null;
}

/** t7 예비특보 → 구역별 발효 예상 시각. announcedAt으로 연도를 정한다. */
export function parsePreliminary(t7: string, announcedAt: string): PreliminaryWarning[] {
  const out: PreliminaryWarning[] = [];
  const text = clean(t7);
  if (!text || /^o?\s*없음$/.test(text)) return out;
  const announced = new Date(announcedAt);
  const kstAnnounced = new Date(announced.getTime() + 9 * 3600_000);
  const blocks = text.split(/\(\d+\)\s*/).filter(Boolean);
  for (const block of blocks) {
    const km = block.match(/^([가-힣]+?)\s*예비특보/);
    const kind = km ? KINDS.find((k) => k === km[1]) : undefined;
    if (!kind) continue;
    const re = /o\s*(\d{1,2})월\s*(\d{1,2})일\s*([^:]*?)\s*:\s*(.+?)(?=\s+o\s*\d{1,2}월|$)/g;
    for (const m of block.matchAll(re)) {
      const month = Number(m[1]);
      const day = Number(m[2]);
      const word = m[3].split("~")[0].trim();
      const hour = timeWordStartHour(word);
      let year = kstAnnounced.getUTCFullYear();
      if (month < kstAnnounced.getUTCMonth() + 1 - 6) year += 1; // 12월 발표 → 1월 예비특보
      const kst = Date.UTC(year, month - 1, day, hour ?? 0) - 9 * 3600_000;
      const expectedAt = new Date(kst).toISOString();
      const timeText = clean(`${m[1]}월 ${m[2]}일 ${m[3]}`);
      for (const zoneCode of zonesFromList(m[4])) out.push({ zoneCode, kind, expectedAt, timeText, timeApprox: hour === null });
    }
  }
  return out;
}

export interface PwnCdRow {
  areaCode: string;
  warnVar: number;
  warnStress: number;
  command: number;
  startTime: string | null;
  endTime: string | null;
  tmFc: string | null;
  cancel: number;
}

/** 특보코드조회 기록에서 (구역, 종류)별 마지막 유효 발표의 발효 시각 — 해제된 것은 제외 */
export function latestStartTimes(rows: PwnCdRow[]): Map<string, string> {
  const latest = new Map<string, PwnCdRow>();
  const sorted = [...rows].filter((r) => r.cancel !== 1).sort((a, b) => (a.tmFc ?? "").localeCompare(b.tmFc ?? ""));
  for (const r of sorted) latest.set(`${r.areaCode}|${r.warnVar}`, r);
  const out = new Map<string, string>();
  for (const [key, r] of latest) {
    if (r.command === 2 || r.command === 8) continue;
    if (r.startTime) out.set(key, r.startTime);
  }
  return out;
}

export function warnVarOf(kind: WarningKind): number {
  return Number(Object.entries(WARN_VAR).find(([, k]) => k === kind)?.[0] ?? 0);
}

export function kindOfWarnVar(n: number): WarningKind | null {
  return WARN_VAR[n] ?? null;
}

export function levelOfStress(n: number): WarningLevel | null {
  return STRESS[n] ?? null;
}
