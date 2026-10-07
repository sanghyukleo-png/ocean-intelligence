import Link from "next/link";
import { ArrowRight, ArrowUpRight, Factory, Newspaper } from "lucide-react";
import { PageShell } from "@/components/shell/page-shell";
import { LiveTicker } from "@/components/home/live-ticker";
import { HeroMap, HeroMapCaption } from "@/components/home/hero-map";
import { KoreaPortStrip } from "@/components/home/korea-port-strip";
import { ToolStrip } from "@/components/home/tool-strip";
import { RecentWorkList } from "@/components/home/recent-work";
import { Reveal } from "@/components/motion/reveal";
import { buttonVariants } from "@/components/ui/button";
import { Badge, DataBadge, formatKst } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { getTickerItems } from "@/lib/market/ticker";
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

export default async function HomePage() {
  const [ticker, news] = await Promise.all([getTickerItems(), getShippingNews(5)]);

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
                <KoreaPortStrip />
              </div>
            </div>
          </div>
        </div>

        {/* 지도(한 벌): lg 이상에서는 오른쪽 배경으로 풀블리드, 그 아래는 본문 흐름 */}
        <div className="max-lg:container-page lg:pointer-events-none lg:absolute lg:right-0 lg:top-6 lg:w-[min(64vw,1240px)] xl:top-2 lg:[mask-image:linear-gradient(to_right,transparent,#000_22%,#000_92%,transparent)]">
          <HeroMap captionClassName="lg:hidden" />
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
          <Link
            href="/opportunities"
            data-spotlight=""
            className="surface-card group flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-8"
          >
            <span className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line bg-inset text-fg-muted transition-colors group-hover:text-accent">
                <Factory size={18} strokeWidth={1.75} aria-hidden="true" />
              </span>
              <span>
                <span className="type-label block text-fg-label">SHIPBUILDING</span>
                <span className="mt-2 block text-lg font-semibold text-fg">조선 영업기획 모듈</span>
                <span className="mt-1 block max-w-2xl text-sm leading-relaxed text-fg-muted">
                  선대 연령·발주잔량·연료 전환 지표로 선주사를 점수화하고 영업 브리프를 만듭니다. 예시 데이터로 동작합니다.
                </span>
              </span>
            </span>
            <span className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "self-start md:self-center")}>
              열기
              <ArrowRight size={14} aria-hidden="true" />
            </span>
          </Link>
        </Reveal>
      </div>
    </PageShell>
  );
}
