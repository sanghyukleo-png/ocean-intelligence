import { connection } from "next/server";
import { overallOf, readSourceRows } from "@/lib/ingest/health";
import { refreshInBackground } from "@/lib/ingest/background";
import { getStore } from "@/lib/store";

// 헤더 상태 점용 요약. 소스 이름·상태만 — 키 값이나 오류 원문은 /status 페이지에서.

export async function GET() {
  await connection();
  const rows = await readSourceRows(getStore({ fresh: true }));
  refreshInBackground();
  const healths = rows.map((r) => r.health);
  const count = (h: string) => healths.filter((x) => x === h).length;
  return Response.json(
    {
      overall: overallOf(healths),
      counts: { ok: count("ok"), delayed: count("delayed") + count("waiting"), failed: count("failed"), nokey: count("nokey"), unavailable: count("blocked") + count("needs-spec") },
    },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  );
}
