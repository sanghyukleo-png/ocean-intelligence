import type { Metadata } from "next";
import { CRACKS, METRICS, readAisGates, readCrack, readMet, readMetric, type MetricDef } from "@/lib/data/read";
import { getStore } from "@/lib/store";
import { PageShell } from "@/components/shell/page-shell";
import { PageHeader } from "@/components/shell/page-header";
import { LiveMetricTile } from "@/components/market/live-metric-tile";
import { ChokepointCard } from "@/components/market/chokepoint-card";
import { BunkerInputCard } from "@/components/market/bunker-input-card";
import { GateWeatherCard } from "@/components/market/gate-weather-card";

export const metadata: Metadata = {
  title: "시황",
  description: "원유·미국 석유제품 현물·크랙 스프레드·수출국 환율·컨테이너 운임지수 — 공식·공개 소스 수집값과 해협 기상, 벙커가 직접 입력.",
};

// ISR 5분 — 수집은 동적 라우트가 맡고(lib/ingest/background.ts) 새 값이 들어오면 이 경로를 재검증한다
export const revalidate = 300;

// 섹션 머리: 제목 + 한 줄 설명. 11px 라벨에 --fg-muted를 쓰지 않는다(지시서 3.1).
function SectionTitle({ id, title, description }: { id: string; title: string; description: string }) {
  return (
    <div className="mb-5 min-w-0">
      <h2 id={id} className="type-h2 text-fg">
        {title}
      </h2>
      <p className="mt-1 text-[0.8125rem] leading-relaxed text-fg-muted">{description}</p>
    </div>
  );
}

const ASSUMPTIONS = (
  <>
    <p>
      <strong>원유</strong> — Brent·WTI는 EIA 일간 종가(EIA가 주 1회 묶어 발표). Dubai 일간 값은 Platts 평가라 쓸 수 없어 IMF가 공개하는{" "}
      <strong>월평균</strong>을 기준월과 함께 표시합니다.
    </p>
    <p>
      <strong>석유제품·크랙</strong> — 싱가포르 등 아시아 제품 현물은 유료 평가(Platts·Argus)라 수집하지 않고, EIA가 공개하는 미국 걸프·뉴욕
      현물을 기준가로 씁니다. 크랙 스프레드는 같은 날짜의 제품가($/gal)×42 − Brent($/bbl)로 계산한 값입니다.
    </p>
    <p>
      <strong>환율</strong> — USD/KRW는 한국수출입은행 → 한국은행 ECOS → ECB 기준환율 순으로 키가 있는 소스를 쓰고, 수출국 통화는 ECB
      기준환율(영업일 1회 고시)입니다. 장중 실시간 환율이 아닙니다.
    </p>
    <p>
      <strong>운임</strong> — SCFI는 상하이해운거래소가 공개하는 종합지수, KCCI는 한국해양진흥공사 공개 지수(주 1회)입니다. 탱커 운임지수(Baltic·
      Worldscale)는 유료라 수집하지 않습니다.
    </p>
    <p>
      <strong>실패 표시</strong> — 수집에 실패하면 마지막 성공값과 실패 사유를, API 키가 없으면 &ldquo;API 키 미설정&rdquo;을 표시합니다. 값을 지어내지
      않습니다.
    </p>
    <p>
      <strong>벙커유</strong> — 약관이 수집·재게시를 허용하는 무료 소스가 없어 수집하지 않습니다. 직접 입력한 값은 이 브라우저에만 저장되고 계산기
      기본값으로 쓰입니다.
    </p>
  </>
);

function TileGrid({ defs, readings }: { defs: MetricDef[]; readings: Awaited<ReturnType<typeof readMetric>>[] }) {
  return (
    <ul role="list" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
      {defs.map((d) => (
        <li key={d.id}>
          <LiveMetricTile def={d} reading={readings.find((r) => r.id === d.id)!} />
        </li>
      ))}
    </ul>
  );
}

export default async function MarketPage() {
  const store = getStore();
  const [readings, cracks, ais, met] = await Promise.all([
    Promise.all(METRICS.map((m) => readMetric(store, m.id))),
    Promise.all(CRACKS.map((c) => readCrack(store, c))),
    readAisGates(store),
    readMet(store),
  ]);
  const group = (g: MetricDef["group"]) => METRICS.filter((m) => m.group === g);
  const crackDefs: MetricDef[] = CRACKS.map((c) => ({ id: c.id, label: c.label, unit: "$/bbl", decimals: 2, sources: [], group: "product", note: "Brent 대비" }));

  return (
    <PageShell>
      <PageHeader
        eyebrow="MARKET"
        title="시황"
        description="원유·석유제품·환율·운임을 공식·공개 소스에서 수집합니다. 값마다 원천 기준 시각과 수집 시각을 함께 표시합니다."
        assumptions={ASSUMPTIONS}
        assumptionsTitle="데이터 기준 · 한계"
      />

      {/* 섹션 간격 clamp(3rem, 6vw, 6rem) — 지시서 3.5, 홈과 같은 값 */}
      <div className="space-y-[clamp(3rem,6vw,6rem)]">
        <section aria-labelledby="market-crude">
          <SectionTitle id="market-crude" title="원유" description="일간 종가(EIA)와 Dubai 월평균(IMF)" />
          <TileGrid defs={group("crude")} readings={readings} />
        </section>

        <section aria-labelledby="market-product">
          <SectionTitle
            id="market-product"
            title="석유제품 · 크랙 스프레드"
            description="미국 걸프·뉴욕 현물(EIA)과 그 값으로 계산한 Brent 대비 크랙 — 제품 마진의 방향을 보는 기준"
          />
          <TileGrid defs={crackDefs} readings={cracks} />
          <div className="mt-4 lg:mt-6">
            <TileGrid defs={group("product")} readings={readings} />
          </div>
        </section>

        <section aria-labelledby="market-fx">
          <SectionTitle id="market-fx" title="환율" description="원화와 주요 수출 시장 통화 — 기준환율(영업일 1회 고시)" />
          <TileGrid defs={group("fx")} readings={readings} />
        </section>

        <section aria-labelledby="market-freight">
          <SectionTitle id="market-freight" title="운임 · 해협" description="컨테이너 운임지수와 주요 해협의 바다 상태" />
          <TileGrid defs={group("freight")} readings={readings} />
          <div className="mt-4 grid gap-4 lg:mt-6 lg:grid-cols-2 lg:gap-6">
            <GateWeatherCard feed={met} />
            <ChokepointCard feed={ais} />
          </div>
        </section>

        <section aria-labelledby="market-bunker">
          <SectionTitle id="market-bunker" title="벙커유" description="수집하지 않는 값 — 견적을 넣어 두면 계산기가 기본값으로 씁니다" />
          <BunkerInputCard />
        </section>
      </div>
    </PageShell>
  );
}
