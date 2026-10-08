import { callDataGoKr } from "./datagokr";
import { kmaTimeToIso, kstYmd, toNumber } from "./http";
import { SourceError, type SourceDef } from "./types";
import { latestStartTimes, parseActive, parsePreliminary, warnVarOf, type PwnCdRow, type WarningStatus } from "@/lib/kma/warnings";
import { MID_SEA_REGIONS } from "@/data/kmaPortZones";

// 기상청 공공데이터포털 API (지시서 11.4) — 키 하나(KMA_DATA_GO_KR_KEY)로 특보·중기예보를 함께 쓴다.
// 약관: 공공누리 1유형(출처표시), 개발계정 일 10,000건, 자동승인.

const WRN_BASE = "https://apis.data.go.kr/1360000/WthrWrnInfoService";
const MID_BASE = "https://apis.data.go.kr/1360000/MidFcstInfoService";
const KEY = "KMA_DATA_GO_KR_KEY";
const WRN_PAGE = "https://www.weather.go.kr/w/special-report/overall.do";
const MID_PAGE = "https://www.weather.go.kr/w/forecast/ocean/mid-term.do";
const KEY_HELP = "공공데이터포털(data.go.kr) 「기상청_기상특보 조회서비스」·「기상청_중기예보 조회서비스」 활용신청(자동승인)";

export const KMA_WARNINGS_KEY = "kma.warnings";
export const KMA_MIDSEA_KEY = "kma.midsea";

/** getPwnStatus 항목들 중 가장 최근 발표 하나로 현황을 만든다 */
export function buildWarningStatus(statusItems: Record<string, unknown>[], cdItems: Record<string, unknown>[]): WarningStatus | null {
  const latest = [...statusItems].sort((a, b) => String(b.tmFc ?? "").localeCompare(String(a.tmFc ?? "")))[0];
  if (!latest) return null;
  const announcedAt = kmaTimeToIso(latest.tmFc as string);
  if (!announcedAt) throw new SourceError("parse", "tmFc 형식 오류");
  const t6 = String(latest.t6 ?? "");
  const t7 = String(latest.t7 ?? "");
  const rows: PwnCdRow[] = cdItems
    .filter((r) => String(r.areaCode ?? "").startsWith("S"))
    .map((r) => ({
      areaCode: String(r.areaCode),
      warnVar: Number(r.warnVar),
      warnStress: Number(r.warnStress),
      command: Number(r.command),
      startTime: kmaTimeToIso(r.startTime as string),
      endTime: kmaTimeToIso(r.endTime as string),
      tmFc: String(r.tmFc ?? ""),
      cancel: Number(r.cancel ?? 0),
    }));
  const starts = latestStartTimes(rows);
  return {
    announcedAt,
    effectiveAt: kmaTimeToIso(latest.tmEf as string),
    active: parseActive(t6).map((w) => ({ ...w, since: starts.get(`${w.zoneCode}|${warnVarOf(w.kind)}`) ?? null })),
    preliminary: parsePreliminary(t7, announcedAt),
    raw: { t6, t7, other: String(latest.other ?? "") },
  };
}

export const kmaWarningsSource: SourceDef = {
  id: "kma-warnings",
  name: "기상청 기상특보 조회서비스",
  label: "기상청",
  sourceUrl: WRN_PAGE,
  provides: [KMA_WARNINGS_KEY],
  envKeys: [KEY],
  keyHelp: KEY_HELP,
  availability: "ready",
  cadence: "수시(특보 발표·해제 시)",
  minIntervalSec: 10 * 60,
  retryIntervalSec: 5 * 60,
  staleAfterSec: 40 * 60,
  terms: "공공누리 1유형(출처표시) · 일 10,000건",
  async collect({ env, now, fetch }) {
    const key = env[KEY]!;
    const status = await callDataGoKr(fetch, WRN_BASE, "getPwnStatus", { numOfRows: "10", pageNo: "1" }, key);
    // 특보코드조회는 발효 시각 근거용 — 실패해도 현황은 저장한다
    let cdItems: Record<string, unknown>[] = [];
    const warnings: string[] = [];
    try {
      const cd = await callDataGoKr(fetch, WRN_BASE, "getPwnCd", { numOfRows: "1000", pageNo: "1", fromTmFc: kstYmd(now, -6), toTmFc: kstYmd(now) }, key);
      cdItems = cd.items;
    } catch (e) {
      warnings.push(`특보코드조회 실패 — 발효 시각 근거 없음 (${e instanceof Error ? e.message : "오류"})`);
    }
    const built = status.noData ? null : buildWarningStatus(status.items, cdItems);
    const data: WarningStatus = built ?? {
      // 최근 7일 특보 현황 자료 없음 = 발효 중 특보 없음
      announcedAt: now.toISOString(),
      effectiveAt: null,
      active: [],
      preliminary: [],
      raw: { t6: "최근 7일 특보 현황 자료 없음", t7: "", other: "" },
    };
    return {
      snapshots: [{ key: KMA_WARNINGS_KEY, data, asOf: data.effectiveAt ?? data.announcedAt, fetchedAt: now.toISOString(), source: "기상청", sourceUrl: WRN_PAGE }],
      warnings,
    };
  },
};

export interface MidSeaRegion {
  regId: string;
  name: string;
  /** 발표 시각(ISO) */
  tmFc: string;
  /** 날짜(KST, YYYY-MM-DD)별 최고 예상파고(m) — 오전·오후 중 큰 값 */
  days: { date: string; waveMaxM: number }[];
}

/** 중기해상예보 발표 시각: 06·18시. 가장 최근 발표 시각(KST)을 "YYYYMMDDHHmm"으로 */
export function latestMidTmFc(now: Date): string {
  const kst = new Date(now.getTime() + 9 * 3600_000);
  const h = kst.getUTCHours();
  // 발표 직후에는 아직 자료가 없을 수 있어 30분 여유를 둔다
  const mins = h * 60 + kst.getUTCMinutes();
  let day = kst;
  let hh = "1800";
  if (mins < 6 * 60 + 30) {
    day = new Date(kst.getTime() - 86400_000);
  } else if (mins < 18 * 60 + 30) hh = "0600";
  return `${day.toISOString().slice(0, 10).replace(/-/g, "")}${hh}`;
}

export function parseMidSea(item: Record<string, unknown>, regId: string, tmFc: string): MidSeaRegion {
  const base = new Date(`${tmFc.slice(0, 4)}-${tmFc.slice(4, 6)}-${tmFc.slice(6, 8)}T00:00:00Z`);
  const days: MidSeaRegion["days"] = [];
  for (let n = 4; n <= 10; n++) {
    const candidates = n <= 7 ? [item[`wh${n}BAm`], item[`wh${n}BPm`]] : [item[`wh${n}B`]];
    const vals = candidates.map(toNumber).filter((v): v is number => v !== null);
    if (!vals.length) continue;
    const date = new Date(base.getTime() + n * 86400_000).toISOString().slice(0, 10);
    days.push({ date, waveMaxM: Math.max(...vals) });
  }
  return { regId, name: MID_SEA_REGIONS[regId] ?? regId, tmFc: kmaTimeToIso(tmFc) ?? tmFc, days };
}

export const kmaMidSeaSource: SourceDef = {
  id: "kma-midsea",
  name: "기상청 중기해상예보",
  label: "기상청",
  sourceUrl: MID_PAGE,
  provides: [KMA_MIDSEA_KEY],
  envKeys: [KEY],
  keyHelp: KEY_HELP,
  availability: "ready",
  cadence: "일 2회(06·18시 발표)",
  minIntervalSec: 2 * 3600,
  retryIntervalSec: 20 * 60,
  staleAfterSec: 14 * 3600,
  terms: "공공누리 1유형(출처표시) · 일 10,000건",
  async collect({ env, now, fetch }) {
    const key = env[KEY]!;
    const tmFc = latestMidTmFc(now);
    const regions: MidSeaRegion[] = [];
    const warnings: string[] = [];
    for (const regId of Object.keys(MID_SEA_REGIONS)) {
      try {
        const r = await callDataGoKr(fetch, MID_BASE, "getMidSeaFcst", { numOfRows: "10", pageNo: "1", regId, tmFc }, key);
        if (r.items[0]) regions.push(parseMidSea(r.items[0], regId, tmFc));
        else warnings.push(`${MID_SEA_REGIONS[regId]} 자료 없음`);
      } catch (e) {
        // 인증 오류는 전체 실패로
        if (e instanceof SourceError && e.kind === "auth") throw e;
        warnings.push(`${MID_SEA_REGIONS[regId]} ${e instanceof Error ? e.message : "오류"}`);
      }
    }
    if (!regions.length) throw new SourceError("empty", `중기해상예보 ${tmFc} 자료 없음`);
    return {
      snapshots: [{ key: KMA_MIDSEA_KEY, data: regions, asOf: kmaTimeToIso(tmFc) ?? now.toISOString(), fetchedAt: now.toISOString(), source: "기상청", sourceUrl: MID_PAGE }],
      warnings,
    };
  },
};

// API허브(apihub.kma.go.kr) — 단기 해상예보·태풍. 가입(휴대폰 인증) 후 서비스 명세를 받아야 필드를 알 수 있다.
export const kmaApiHubSource: SourceDef = {
  id: "kma-apihub",
  name: "기상청 API허브 (단기 해상예보·태풍)",
  label: "기상청",
  sourceUrl: "https://apihub.kma.go.kr/",
  provides: ["kma.shortsea", "kma.typhoon"],
  envKeys: ["KMA_APIHUB_KEY"],
  keyHelp: "기상청 API허브 가입(휴대폰 인증) 후 단기 해상예보·태풍 서비스 신청",
  availability: "needs-spec",
  note: "서비스 명세(엔드포인트·응답 필드·구역 코드)를 받은 뒤 구현 — 추측으로 필드명을 쓰지 않는다(지시서 11.4)",
  cadence: "단기 해상예보 일 2~8회 · 태풍 수시",
  minIntervalSec: 3600,
  retryIntervalSec: 15 * 60,
  staleAfterSec: 6 * 3600,
  terms: "공공누리 · 한도는 가입 후 확인",
};
