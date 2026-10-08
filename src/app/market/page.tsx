import type { Metadata } from "next";
import { mockMarketIndicators, mockMarketSignals } from "@/data/mockMarket";
import { METRICS, readAisGates, readMetric } from "@/lib/data/read";
import { ChokepointCard } from "@/components/market/chokepoint-card";
import { BunkerInputCard } from "@/components/market/bunker-input-card";
import { getStore } from "@/lib/store";
import { LiveMetricTile } from "@/components/market/live-metric-tile";
import { PageShell } from "@/components/shell/page-shell";
import { PageHeader } from "@/components/shell/page-header";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { DataBadge } from "@/components/ui/badge";
import { MarketStatTile } from "@/components/market/market-stat-tile";
import { SignalCard } from "@/components/market/signal-card";

export const metadata: Metadata = {
  title: "시황",
  description:
    "Brent·WTI·Dubai 월평균·USD/KRW·SCFI·KCCI 수집 지표, 벙커가 직접 입력, 조선 시황 예시 지표·시그널(예시 데이터).",
};

// ISR 5분 — 홈과 같은 규칙(lib/ingest/background.ts)
export const revalidate = 300;

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
      <strong>수집 지표</strong> — Brent·WTI는 EIA 일간 종가(주 1회 발표), USD/KRW는 한국수출입은행 → 한국은행 ECOS →
      ECB 기준환율 순으로 키가 있는 소스를 씁니다. Dubai는 일간 값(Platts)을 쓸 수 없어 IMF가 공개하는 <strong>월평균</strong>을
      표시합니다. SCFI는 상하이해운거래소가 공개하는 종합지수, KCCI는 한국해양진흥공사 공개 지수입니다. 수집에 실패하면
      마지막 성공값과 실패 사유를 표시하고, API 키가 없으면 값을 비워 둡니다.
    </p>
    <p>
      <strong>벙커유</strong> — 약관이 수집·재게시를 허용하는 무료 소스가 없어 수집하지 않습니다. 직접 입력한 값은 이 브라우저에만
      저장되고 계산기 기본값으로 쓰입니다.
    </p>
    <p>
      <strong>조선 지표</strong> — 이후 조선 영업기회 화면으로 옮깁니다.
    </p>
  </>
);

export default async function MarketPage() {
  const store = getStore();
  const [readings, ais] = await Promise.all([Promise.all(METRICS.map((m) => readMetric(store, m.id))), readAisGates(store)]);
  return (
    <PageShell>
      <PageHeader
        eyebrow="MARKET"
        title="시황"
        description="유가·환율·운임은 공식 소스 수집값, 조선 시황 지표와 시그널은 예시 데이터입니다."
        assumptions={ASSUMPTIONS}
        assumptionsTitle="데이터 기준 · 한계"
      />

      {/* 섹션 간격 clamp(3rem, 6vw, 6rem) — 지시서 3.5, 홈과 같은 값 */}
      <div className="space-y-[clamp(3rem,6vw,6rem)]">
        <section aria-labelledby="market-live">
          <SectionTitle
            id="market-live"
            title="유가 · 환율 · 운임"
            description="공식·공공 소스에서 서버가 수집한 값입니다. 소스마다 발표 주기가 달라 원천 기준 시각을 함께 표시합니다."
            badge={null}
          />
          <ul role="list" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {readings.map((r) => (
              <li key={r.id}>
                <LiveMetricTile def={METRICS.find((m) => m.id === r.id)!} reading={r} />
              </li>
            ))}
          </ul>
          <div className="mt-4 grid gap-4 lg:mt-6 lg:gap-6">
            <ChokepointCard feed={ais} />
            <BunkerInputCard />
          </div>
        </section>

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
