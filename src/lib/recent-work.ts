// 계산기 최근 작업 — 이 브라우저의 localStorage에만 저장된다(서버 전송 없음).
// 각 계산기는 결과를 낼 때 pushRecentWork를 호출하고, 홈·⌘K는 readRecentWork로 읽는다.

export interface RecentWork {
  id: string;
  /** 도구 경로 (예: "/ops/laytime") */
  tool: string;
  title: string;
  /** 한 줄 요약 (예: "체선 12.00h · $15,000") */
  summary: string;
  /** 입력값이 직렬화된 공유 링크 */
  href: string;
  /** ISO 시각 */
  at: string;
}

const KEY = "oi-recent-work";
const PER_TOOL = 10;

export function readRecentWork(): RecentWork[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((r): r is RecentWork => typeof r?.id === "string" && typeof r?.href === "string" && typeof r?.at === "string")
      .sort((a, b) => b.at.localeCompare(a.at));
  } catch {
    return [];
  }
}

/** 같은 href는 최신으로 갱신, 도구별 최근 10건 유지 */
export function pushRecentWork(entry: Omit<RecentWork, "id" | "at"> & { at?: string }) {
  try {
    const now = entry.at ?? new Date().toISOString();
    const rest = readRecentWork().filter((r) => r.href !== entry.href);
    const next: RecentWork[] = [{ ...entry, id: `${entry.tool}-${now}`, at: now }, ...rest];
    const counts = new Map<string, number>();
    const trimmed = next.filter((r) => {
      const n = (counts.get(r.tool) ?? 0) + 1;
      counts.set(r.tool, n);
      return n <= PER_TOOL;
    });
    window.localStorage.setItem(KEY, JSON.stringify(trimmed));
    window.dispatchEvent(new Event("oi:recent-work"));
  } catch {
    // 저장 불가(사파리 개인정보 보호 모드 등) — 계산 자체에는 영향 없음
  }
}
