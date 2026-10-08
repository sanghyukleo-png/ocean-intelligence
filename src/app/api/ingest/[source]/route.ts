import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";
import { refreshDue } from "@/lib/ingest/run";
import { ISR_PAGES, changedState } from "@/lib/ingest/background";
import { SOURCES } from "@/lib/sources";
import { getStore } from "@/lib/store";

// 외부 스케줄러(Supabase pg_cron · Vercel cron 등)가 부르는 수집 엔드포인트.
//   GET|POST /api/ingest/all            기한 지난 모든 소스
//   GET|POST /api/ingest/<source-id>     한 소스 (?force=1 이면 최소 간격 무시)
//   ?simulate=fail                       그 소스를 일부러 실패시켜 화면이 마지막 성공값·실패 표시로 바뀌는지 확인(11.7)
// 인증: Authorization: Bearer <CRON_SECRET> (Vercel cron이 같은 형식으로 보낸다). 운영에서 CRON_SECRET이 없으면 거부.

export const maxDuration = 60;

async function handle(req: NextRequest, ctx: RouteContext<"/api/ingest/[source]">) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    if (req.headers.get("authorization") !== `Bearer ${secret}`) return Response.json({ error: "unauthorized" }, { status: 401 });
  } else if (process.env.NODE_ENV === "production") {
    return Response.json({ error: "CRON_SECRET 미설정 — 운영 환경에서는 수집 엔드포인트를 열지 않음" }, { status: 503 });
  }

  const { source } = await ctx.params;
  const ids = source === "all" ? undefined : [source];
  if (ids && !SOURCES.some((s) => s.id === source)) return Response.json({ error: `unknown source ${source}` }, { status: 404 });

  const force = req.nextUrl.searchParams.get("force") === "1";
  const simulate = ids && req.nextUrl.searchParams.get("simulate") === "fail";
  const env = simulate ? { ...process.env, INGEST_SIMULATE_FAILURE: source } : process.env;
  const results = await refreshDue(getStore({ fresh: true }), ids, { force, env });
  if (results.some(changedState)) for (const p of ISR_PAGES) revalidatePath(p);
  return Response.json({ at: new Date().toISOString(), results }, { headers: { "Cache-Control": "no-store" } });
}

export const GET = handle;
export const POST = handle;
