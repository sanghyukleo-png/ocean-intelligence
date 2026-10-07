import type { Metadata } from "next";
import { Fragment } from "react";
import { PlugZap } from "lucide-react";
import { mockMarketIndicators, mockMarketSignals } from "@/data/mockMarket";
import { TICKER_SPEC } from "@/lib/market/ticker";
import { PageShell } from "@/components/shell/page-shell";
import { PageHeader } from "@/components/shell/page-header";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { DataBadge } from "@/components/ui/badge";
import { MarketStatTile } from "@/components/market/market-stat-tile";
import { SignalCard } from "@/components/market/signal-card";

export const metadata: Metadata = {
  title: "시황",
  description:
    "조선 시황 예시 지표 8개와 시장 시그널 (예시 데이터). 유가·환율·벙커·SCFI LIVE 지표는 데이터 소스 연결 후 표시됩니다.",
};

// 상단에 들어올 LIVE 지표 이름(홈 티커 사양과 같은 목록, 국내항 경보 제외)
const PLANNED_LIVE = TICKER_SPEC.filter((t) => t.key !== "kr-warnings").map((t) => t.label);

const IMPORTANCE_RANK = { high: 0, medium: 1, low: 2 } as const;
const SIGNALS = [...mockMarketSignals].sort((a, b) => IMPORTANCE_RANK[a.importance] - IMPORTANCE_RANK[b.importance]);

// 섹션 머리: 제목 + 등급 배지 + 한 줄 설명. 영문 아이브로는 두지 않는다 —
// 제목·배지가 이미 섹션을 말하고, 11px 라벨에 --fg-muted를 쓰지 않는다(지시서 3.1).
function SectionTitle({
  id,
  title,
  description,
  badge,
}: {
  id: string;
  title: string;
  description: string;
  badge: React.ReactNode;
}) {
  return (
    <div className="mb-5 min-w-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h2 id={id} className="type-h2 text-fg">
          {title}
        </h2>
        {badge}
      </div>
      <p className="mt-1 text-[0.8125rem] leading-relaxed text-fg-muted">{description}</p>
    </div>
  );
}

const ASSUMPTIONS = (
  <>
    <p>
      <strong>예시 데이터</strong> — 조선 시황 지표 8개와 시장 시그널 6개는 시뮬레이션 예시 값입니다. 실제 시장
      값이 아니며, 모든 수치에 DEMO 배지를 붙였습니다.
    </p>
    <p>
      <strong>변동률·추이</strong> — 타일의 변동률과 스파크라인도 예시 값이며 기준 기간을 특정하지 않습니다. 상승·하락의
      좋고 나쁨은 관점에 따라 다르므로 색으로 구분하지 않고 화살표와 부호로만 표시합니다.
    </p>
    <p>
      <strong>시그널 중요도</strong> — 높음·보통·낮음은 예시 판단입니다.
    </p>
    <p>
      <strong>예정</strong> — 유가·환율·벙커·SCFI LIVE 지표는 서버 수집으로 연결할 예정입니다. 수집에 실패하면
      마지막 성공값과 수집 시각을 함께 표시하고, 연결 전에는 값을 비워 둡니다. 조선 지표는 이후 조선 영업기회 화면으로
      옮깁니다.
    </p>
  </>
);

export default function MarketPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="MARKET"
        title="시황"
        description="조선 시황 지표와 시그널의 예시 화면입니다. 유가·환율·운임 LIVE 지표는 연결 예정입니다."
        assumptions={ASSUMPTIONS}
        assumptionsTitle="데이터 기준 · 한계"
      />

      {/* 섹션 간격 clamp(3rem, 6vw, 6rem) — 지시서 3.5, 홈과 같은 값 */}
      <div className="space-y-[clamp(3rem,6vw,6rem)]">
        {/* LIVE 지표 자리 — 소스 연결 전에는 가짜 값을 채우지 않는다 */}
        <aside
          aria-label="LIVE 지표 연결 예정"
          className="flex flex-col gap-4 rounded-xl border border-dashed border-line-strong p-4 sm:flex-row sm:items-center sm:justify-between md:px-5"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-inset text-fg-muted">
              <PlugZap size={16} strokeWidth={1.75} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium leading-snug text-fg">
                유가·환율·벙커·SCFI LIVE 지표는 데이터 소스 연결 후 이 화면 상단에 표시됩니다
              </p>
              {/* 지표 이름 하나("VLSFO 부산")가 줄바꿈으로 갈라지지 않게 이름 단위로 묶고,
                  구분점은 앞 이름에 붙여 줄이 "·"로 시작하지 않게 한다 */}
              <p className="mt-1 text-xs leading-relaxed text-fg-muted">
                {PLANNED_LIVE.map((label, i) => (
                  <Fragment key={label}>
                    {i > 0 && " "}
                    <span className="whitespace-nowrap">
                      {label}
                      {i < PLANNED_LIVE.length - 1 && " ·"}
                    </span>
                  </Fragment>
                ))}
              </p>
            </div>
          </div>
          <DataBadge grade="pending" className="ml-12 self-start sm:ml-0 sm:self-center" />
        </aside>

        <section aria-labelledby="market-indicators">
          <SectionTitle
            id="market-indicators"
            title="조선 시황 지표"
            description="선대·발주·해체·연료 전환 흐름을 보여주는 예시 지표 8개"
            badge={<DataBadge grade="demo" />}
          />
          {/* role="list": list-style none인 ul은 Safari/VoiceOver가 목록 의미를 버린다 */}
          <Stagger as="ul" role="list" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-6 xl:grid-cols-4">
            {mockMarketIndicators.map((ind) => (
              <StaggerItem as="li" key={ind.id}>
                <MarketStatTile indicator={ind} />
              </StaggerItem>
            ))}
          </Stagger>
        </section>

        <section aria-labelledby="market-signals">
          <SectionTitle
            id="market-signals"
            title="시장 시그널"
            description="지표 흐름에서 읽어낸 예시 해석 — 중요도 순"
            badge={<DataBadge grade="demo" />}
          />
          <Stagger as="ul" role="list" className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-6 xl:grid-cols-3">
            {SIGNALS.map((s) => (
              <StaggerItem as="li" key={s.id}>
                <SignalCard signal={s} />
              </StaggerItem>
            ))}
          </Stagger>
        </section>
      </div>
    </PageShell>
  );
}
