import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { getStore } from "@/lib/store";
import { refreshDue, type RunOutcome } from "./run";

// 요청 시 갱신(stale-while-revalidate) — 동적 라우트(/api/status, /api/data, /status)에서만 부른다.
// 정적·ISR 페이지의 after()는 빌드·재검증 렌더 중에 실행되어 캐시하지 않는 외부 호출이 막히므로 쓰지 않는다.
// 헤더 상태 점이 모든 페이지에서 /api/status를 부르므로 방문이 곧 수집 계기가 된다(Vercel 플랜 무관).
export const ISR_PAGES = ["/", "/market", "/ops/weather"];

/** 화면 표시가 달라질 수 있는 결과 — 성공 또는 실패(건너뜀·키 없음은 그대로) */
export const changedState = (r: RunOutcome) => r.status === "ok" || r.status === "failed";

export function refreshInBackground() {
  after(async () => {
    const results = await refreshDue(getStore({ fresh: true }), undefined, { onRequest: true });
    // 새 값이 들어오거나 실패로 바뀌면(LIVE → 수집 실패) 정적 페이지를 다음 방문 때 다시 그리게 한다
    if (!results.some(changedState)) return;
    for (const p of ISR_PAGES) {
      try {
        revalidatePath(p);
      } catch {
        // 페이지 렌더(/status)의 after 안에서는 재검증 API를 쓸 수 없다 — ISR 주기(5분)로 갱신된다
      }
    }
  });
}
