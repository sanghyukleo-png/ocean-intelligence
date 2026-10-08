import Link from "next/link";
import { ArrowRight, ArrowUpRight, Newspaper } from "lucide-react";
import { PageShell } from "@/components/shell/page-shell";
import { LiveTicker } from "@/components/home/live-ticker";
import { HeroMap, HeroMapCaption, type GateNow } from "@/components/home/hero-map";
import { KoreaPortStrip } from "@/components/home/korea-port-strip";
import { ToolStrip } from "@/components/home/tool-strip";
import { RecentWorkList } from "@/components/home/recent-work";
import { Reveal } from "@/components/motion/reveal";
import { buttonVariants } from "@/components/ui/button";
import { Badge, DataBadge, formatKst } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { getTickerItems } from "@/lib/market/ticker";
import { readMet, readPortRisks } from "@/lib/data/read";
import { OVERSEAS_PORTS } from "@/data/overseasPorts";
import { compass, summarizeMet } from "@/lib/weather/metSummary";
import { formatNum } from "@/lib/utils";
import { getStore } from "@/lib/store";
import { getShippingNews } from "@/lib/liveFeed";
import { cn } from "@/lib/utils";

const HERO_LINES = ["해상 오퍼레이션을", "숫자로 끝냅니다"];

function SectionTitle({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <p className="type-label text-fg-label">{eyebrow}</p>
        <h2 className="type-h2 mt-2 text-fg">{title}</h2>
      </div>
      {action}
    </div>
  );
}

// ISR 5분. 수집은 동적 라우트가 맡고(lib/ingest/background.ts) 새 값이 들어오면 이 경로를 재검증한다
export const revalidate = 300;

export default async function HomePage() {
  const store = getStore();
  const [ticker, board, news, met] = await Promise.all([getTickerItems(store), readPortRisks(store), getShippingNews(5), readMet(store)]);
  const gates: GateNow = {};
  const overseas: { op: (typeof OVERSEAS_PORTS)[number]; s: ReturnType<typeof summarizeMet> | null }[] = OVERSEAS_PORTS.map((op) => {
    const p = met.state === "ok" ? met.data.points.find((x) => x.kind === "overseas" && x.id === op.id) : undefined;
    return { op, s: p ? summarizeMet(p) : null };
  });
  if (met.state === "ok") for (const p of met.data.points.filter((x) => x.kind === "gate")) gates[p.id] = { windKt: p.windKt[0] ?? null, waveM: p.waveM[0] ?? null };

  return (
    <PageShell bleed>
      <LiveTicker items={ticker} />

      {/* ── 히어로 ─────────────────────────────────────────────── */}
      <section aria-labelledby="hero-title" className="relative overflow-x-clip">
        <div className="container-page relative z-10">
          <div className="grid pb-10 pt-12 md:pt-16 lg:grid-cols-12 lg:pb-14 lg:pt-24 xl:pt-28">
            <div className="lg:col-span-6 xl:col-span-5">
              <p className="intro-fade type-label text-accent" style={{ "--d": "160ms" } as React.CSSProperties}>
                MARINE OPERATIONS DESK
              </p>
              <h1 id="hero-title" className="type-display mt-5 text-fg">
                {HERO_LINES.map((line, i) => (
                  <span key={line} className="intro-mask">
                    <span className="intro-line" style={{ "--i": i } as React.CSSProperties}>
                      {line}
                    </span>
                  </span>
                ))}
              </h1>
              <p
                className="intro-fade mt-6 max-w-xl text-base leading-relaxed text-fg-muted md:text-[1.0625rem]"
                style={{ "--d": "420ms" } as React.CSSProperties}
              >
                정유·석유화학 선적·용선·수출입 실무를 위한 계산 데스크. Laytime 정산부터{" "}
                <span className="whitespace-nowrap">운임·넷백,</span> Q88 검토, 국내항 기상 위험도까지.
              </p>
              <div className="intro-fade mt-8 flex flex-wrap gap-3" style={{ "--d": "900ms" } as React.CSSProperties}>
                <Link href="/ops/laytime" className={buttonVariants({ variant: "primary", size: "md" })}>
                  Laytime 계산 시작
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
                <Link href="/vessels" className={buttonVariants({ variant: "secondary", size: "md" })}>
                  Q88 올려보기
                </Link>
              </div>
              <div className="intro-fade mt-10 max-w-xl" style={{ "--d": "900ms" } as React.CSSProperties}>
                <KoreaPortStrip board={board} />
              </div>
            </div>
          </div>
        </div>

        {/* 지도(한 벌): lg 이상에서는 오른쪽 배경으로 풀블리드, 그 아래는 본문 흐름 */}
        <div className="max-lg:container-page lg:pointer-events-none lg:absolute lg:right-0 lg:top-6 lg:w-[min(64vw,1240px)] xl:top-2 lg:[mask-image:linear-gradient(to_right,transparent,#000_22%,#000_92%,transparent)]">
          <HeroMap captionClassName="lg:hidden" gates={gates} />
        </div>

        <div className="container-page relative z-10 max-lg:mt-10">
          <HeroMapCaption className="-mt-6 mb-4 hidden text-right lg:block" />
          <ToolStrip className="pb-4" />
        </div>
      </section>

      {/* ── 스크롤 아래 ─────────────────────────────────────────── */}
      <div className="container-page mt-[clamp(3rem,6vw,6rem)] space-y-[clamp(3rem,6vw,6rem)]">
        <div className="grid gap-10 lg:grid-cols-12">
          <Reveal as="section" className="lg:col-span-5">
            <SectionTitle eyebrow="RECENT" title="최근 작업" />
            <RecentWorkList />
          </Reveal>

          <Reveal as="section" delay={0.06} className="lg:col-span-7">
            <SectionTitle
              eyebrow="NEWS"
              title="해운 뉴스"
              action={
                news.ok ? (
                  <DataBadge grade="live" source={news.source} fetchedAt={news.fetchedAt} cadence="RSS · 30분 캐시" />
                ) : (
                  <Badge tone="warn" dot>
                    수집 실패
                  </Badge>
                )
              }
            />
            {news.ok ? (
              <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-raised">
                {news.items.map((n) => (
                  <li key={n.link}>
                    <a
                      href={n.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex min-h-14 items-start justify-between gap-4 px-4 py-3 transition-colors hover:bg-subtle"
                    >
                      <span className="min-w-0">
                        <span className="block text-sm font-medium leading-snug text-fg [overflow-wrap:break-word] [word-break:normal]">
                          {n.title}
                        </span>
                        <span className="mt-1 block text-xs text-fg-muted">
                          {n.source}
                          {n.publishedAt && <span className="num"> · {formatKst(n.publishedAt)}</span>}
                        </span>
                      </span>
                      <ArrowUpRight
                        size={15}
                        aria-hidden="true"
                        className="mt-0.5 shrink-0 text-fg-faint transition-colors group-hover:text-fg"
                      />
                      <span className="sr-only">(새 창)</span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={Newspaper}
                title="뉴스를 가져오지 못했습니다"
                description={`${news.source} · ${news.error} · 시도 ${formatKst(news.fetchedAt)} KST`}
              />
            )}
            <p className="mt-3 text-xs text-fg-muted">
              헤드라인과 원문 링크만 표시합니다. 국문 정유·석화 키워드 피드는 추가 예정입니다.
            </p>
          </Reveal>
        </div>

        <Reveal as="section">
          <SectionTitle
            eyebrow="OVERSEAS PORTS"
            title="해외 항만 바다 상태"
            action={
              met.state === "ok" ? (
                <DataBadge grade="live" source="Open-Meteo" asOf={met.asOf} fetchedAt={met.fetchedAt} cadence="모델 갱신 시간별" />
              ) : met.state === "failed" ? (
                <DataBadge grade="stale" source="Open-Meteo" fetchedAt={met.lastSuccessAt ?? undefined} error={met.error} />
              ) : (
                <DataBadge grade="pending" source="Open-Meteo" />
              )
            }
          />
          <Link href="/ops/weather" data-spotlight="" className="surface-card group block p-4 md:p-5">
            <ul role="list" className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-6">
              {overseas.map(({ op, s }) => (
                <li key={op.id} className="min-w-0">
                  <span className="block text-[0.8125rem] font-medium text-fg">{op.name}</span>
                  {s ? (
                    <>
                      <span className="num mt-1 block text-xs text-fg">
                        {compass(s.now.dirDeg)} {formatNum(s.now.windKt, { decimals: 0 })}kt · {formatNum(s.now.waveM, { decimals: 1 })}m
                      </span>
                      <span className={cn("num mt-1 block text-xs", s.exceedHours[0] > 0 ? "text-warn" : "text-fg-muted")}>
                        24h 기준 초과 {s.exceedHours[0]}h
                      </span>
                    </>
                  ) : (
                    <span className="mt-1 block text-xs text-fg-faint">—</span>
                  )}
                </li>
              ))}
            </ul>
            <span className="mt-4 flex items-center justify-between gap-3 text-xs text-fg-muted">
              <span>지금 바람·파고 · 기준 풍속 25kt·파고 2.0m·시정 1해리 · Weather data by Open-Meteo.com</span>
              <ArrowRight size={14} aria-hidden="true" className="shrink-0 transition-colors group-hover:text-fg" />
            </span>
          </Link>
        </Reveal>
      </div>
    </PageShell>
  );
}
