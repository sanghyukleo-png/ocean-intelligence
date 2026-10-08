import type { NextRequest } from "next/server";
import { METRICS, readMetric, readPortRisks } from "@/lib/data/read";
import { refreshInBackground } from "@/lib/ingest/background";
import { getStore } from "@/lib/store";

// 화면·외부에서 읽는 지표 API. 응답 후 기한 지난 소스를 갱신한다(lib/ingest/background.ts·요청 시 갱신 = stale-while-revalidate).
//   /api/data/<metric>   METRICS의 id (brent, usdkrw …) — 값·등급·출처·최근 30개
//   /api/data/ports      국내 12개 항만 위험도

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/data/[metric]">) {
  const { metric } = await ctx.params;
  const store = getStore({ fresh: true });
  refreshInBackground();

  const headers = { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" };
  if (metric === "ports") return Response.json(await readPortRisks(store), { headers });
  if (!METRICS.some((m) => m.id === metric)) return Response.json({ error: `unknown metric ${metric}` }, { status: 404 });
  return Response.json(await readMetric(store, metric), { headers });
}
