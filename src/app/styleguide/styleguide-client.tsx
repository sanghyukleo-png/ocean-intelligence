"use client";

import { useState } from "react";
import { ArrowRight, Copy, FileText, Inbox, SlidersHorizontal } from "lucide-react";
import { Logo, LogoSymbol, LogoWordmark, type LogoVariant } from "@/components/brand/logo";
import { Badge, DataBadge, ProvenanceLine } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardLabel } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { DateTimeInput } from "@/components/ui/datetime-input";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, TextArea, TextInput } from "@/components/ui/field";
import { NumberInput } from "@/components/ui/number-input";
import { Segmented } from "@/components/ui/segmented";
import { Select } from "@/components/ui/select";
import { Sheet } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Stat } from "@/components/ui/stat";
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { Term, Tooltip } from "@/components/ui/tooltip";
import { AnimatedNumber } from "@/components/motion/animated-number";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { RISK_LEVELS } from "@/lib/tokens";

const LOGO_OPTIONS: { variant: LogoVariant; name: string; note: string }[] = [
  { variant: "meridian", name: "A · 자오선", note: "원 + 위도선 + 원 밖으로 휘어 나가는 대권항로. 가장 '지구본'에 가깝고 정적." },
  { variant: "gate", name: "B · 관문 (기본)", note: "우상단이 열린 원과 출발항 점. 항로가 틈으로 빠져나가 '출항'을 읽히게 한다. 16px에서도 형태 유지." },
  { variant: "contour", name: "C · 등심선", note: "원 안의 등심선 + 가로지르는 항로. 해도 질감이 가장 강하지만 16px에서 안쪽 선이 뭉친다." },
];

const COLOR_GROUPS: { title: string; tokens: string[] }[] = [
  { title: "표면", tokens: ["--bg", "--bg-raised", "--bg-inset", "--bg-subtle", "--line", "--line-strong"] },
  { title: "텍스트", tokens: ["--fg", "--fg-muted", "--fg-faint"] },
  { title: "의미", tokens: ["--accent", "--accent-ink", "--up", "--down", "--warn", "--info"] },
  { title: "지도", tokens: ["--map-sea", "--map-land", "--map-coast", "--map-contour", "--map-label", "--map-route-alt"] },
  { title: "선박", tokens: ["--vessel-ais", "--vessel-sim"] },
];

interface SampleRow {
  id: string;
  item: string;
  qty: number;
  rate: number;
  amount: number;
}
// 컴포넌트 표시용 샘플 행 — 실제 데이터 아님
const SAMPLE_ROWS: SampleRow[] = [
  { id: "1", item: "샘플 항목 A", qty: 35000, rate: 15, amount: 525000 },
  { id: "2", item: "샘플 항목 B", qty: 30000, rate: 15, amount: 450000 },
  { id: "3", item: "샘플 항목 C", qty: 3000, rate: 7.5, amount: 22500 },
  { id: "4", item: "샘플 항목 D (긴 이름이 셀 폭을 넘을 때 줄바꿈 확인)", qty: 12500.5, rate: 22.25, amount: 278136.13 },
];
const SAMPLE_COLUMNS: Column<SampleRow>[] = [
  { key: "item", header: "항목", cell: (r) => r.item, sortValue: (r) => r.item, className: "min-w-48" },
  { key: "qty", header: "수량 (MT)", numeric: true, cell: (r) => r.qty.toLocaleString("en-US"), sortValue: (r) => r.qty },
  { key: "rate", header: "단가 ($/MT)", numeric: true, cell: (r) => r.rate.toFixed(2), sortValue: (r) => r.rate },
  {
    key: "amount",
    header: "금액 ($)",
    numeric: true,
    cell: (r) => r.amount.toLocaleString("en-US", { maximumFractionDigits: 2 }),
    sortValue: (r) => r.amount,
  },
];

function Section({ id, title, children, description }: { id: string; title: string; description?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 space-y-4">
      <div>
        <h2 className="type-h2 text-fg">{title}</h2>
        {description && <p className="mt-1 text-sm text-fg-muted">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function Swatch({ token }: { token: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-9 w-9 shrink-0 rounded-lg border border-line-strong" style={{ background: `var(${token})` }} />
      <code className="num text-xs text-fg-muted">{token}</code>
    </div>
  );
}

export function StyleguideClient() {
  const toast = useToast();
  const [qty, setQty] = useState<number | null>(35000);
  const [rate, setRate] = useState<number | null>(30000);
  const [nor, setNor] = useState<string | null>("2026-10-01T08:00");
  const [mode, setMode] = useState<"fixed" | "rate">("fixed");
  const [ws, setWs] = useState(150);
  const [sheet, setSheet] = useState<false | "bottom" | "right">(false);
  const [demoValue, setDemoValue] = useState(15000);

  return (
    <div className="space-y-16 pb-16">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="type-label text-accent">DEV ONLY</p>
          <h1 className="type-h1 mt-3 text-fg">디자인 시스템</h1>
          <p className="mt-2 max-w-2xl text-fg-muted">
            토큰·타이포·컴포넌트·모션을 한 화면에서 확인합니다. 헤더의 테마 버튼으로 라이트/다크를 전환하세요.
          </p>
        </div>
        <ThemeToggle />
      </header>

      {/* ── 로고 3안 ─────────────────────────────────────────────── */}
      <Section id="logo" title="로고 3안" description="24px 그리드 · 선 굵기 1.75 · 획 3개 이내 · currentColor. 항로 획만 accent.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {LOGO_OPTIONS.map((o) => (
            <Card key={o.variant} className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-fg">{o.name}</span>
              </div>
              <div className="flex flex-wrap items-end gap-x-6 gap-y-4 text-fg">
                <LogoSymbol variant={o.variant} size={16} />
                <LogoSymbol variant={o.variant} size={24} />
                <LogoSymbol variant={o.variant} size={48} />
                <LogoSymbol variant={o.variant} size={96} />
              </div>
              <div className="flex flex-col items-start gap-3 border-t border-line pt-4">
                <Logo variant={o.variant} />
                <Logo variant={o.variant} compact />
              </div>
              <p className="text-xs leading-relaxed text-fg-muted">{o.note}</p>
            </Card>
          ))}
        </div>
        <Card className="flex flex-wrap items-center gap-8">
          <LogoWordmark />
          <span className="flex items-center gap-3 text-fg-muted">
            <LogoSymbol size={24} tone="mono" /> mono
          </span>
          <span className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.svg" width={32} height={32} alt="파비콘" className="rounded" /> <span className="text-xs text-fg-muted">icon.svg</span>
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/apple-icon" width={60} height={60} alt="apple-icon" className="rounded-xl" />
        </Card>
      </Section>

      {/* ── 컬러 ─────────────────────────────────────────────────── */}
      <Section id="color" title="컬러 토큰">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {COLOR_GROUPS.map((g) => (
            <Card key={g.title} className="space-y-3">
              <CardLabel>{g.title}</CardLabel>
              {g.tokens.map((t) => (
                <Swatch key={t} token={t} />
              ))}
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader title="위험도 5단계 (11.4)" description="국내항 클로징 위험도. 지도 채움은 각 색의 18~32% 불투명도로 쓴다." />
          <div className="flex flex-wrap gap-2">
            {RISK_LEVELS.map((r) => (
              <span
                key={r.level}
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold"
                style={{
                  color: `var(${r.token})`,
                  borderColor: `color-mix(in oklab, var(${r.token}) 40%, transparent)`,
                  background: `color-mix(in oklab, var(${r.token}) 12%, transparent)`,
                }}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: `var(${r.token})` }} />
                {r.label}
              </span>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader title="지도 미리보기" description="육지 / 바다 / 등심선 / 항로 / 실제 AIS 선박 vs 계획 항차(시뮬레이션)" />
          <svg viewBox="0 0 640 220" className="h-auto w-full rounded-lg border border-line" role="img" aria-label="지도 토큰 미리보기">
            <rect width="640" height="220" fill="var(--map-sea)" />
            {[0, 1, 2, 3].map((i) => (
              <ellipse key={i} cx="420" cy="120" rx={60 + i * 34} ry={36 + i * 20} fill="none" stroke="var(--map-contour)" strokeWidth="1.25" />
            ))}
            <path d="M0 0 H210 C190 40 230 70 200 110 C170 150 120 160 110 220 H0Z" fill="var(--map-land)" stroke="var(--map-coast)" />
            <path d="M640 0 V70 C600 60 560 40 540 0Z" fill="var(--map-land)" stroke="var(--map-coast)" />
            {RISK_LEVELS.map((r, i) => (
              <rect key={r.level} x={240 + i * 76} y="180" width="64" height="22" rx="4" fill={`var(${r.token})`} fillOpacity="0.24" stroke={`var(${r.token})`} strokeOpacity="0.7" />
            ))}
            <path d="M190 120 C 300 60, 420 50, 600 40" fill="none" stroke="var(--map-route)" strokeWidth="2" strokeLinecap="round" />
            <path d="M190 120 C 300 150, 450 150, 600 110" fill="none" stroke="var(--map-route-alt)" strokeWidth="1.5" strokeDasharray="4 4" />
            <circle cx="190" cy="120" r="4" fill="var(--map-route)" />
            {/* 실제 AIS: 채운 삼각형 */}
            <g fill="var(--vessel-ais)">
              <path d="M330 92 l6 -12 l6 12z" />
              <path d="M470 70 l6 -12 l6 12z" transform="rotate(30 476 64)" />
              <path d="M380 130 l6 -12 l6 12z" transform="rotate(-50 386 124)" />
            </g>
            {/* 시뮬레이션: 속 빈 마름모 + 점선 */}
            <path d="M440 50 l7 7 l-7 7 l-7 -7z" fill="none" stroke="var(--vessel-sim)" strokeWidth="1.75" strokeDasharray="2.5 2" />
            <text x="232" y="34" fontSize="10" fill="var(--map-label)" fontFamily="var(--font-mono)">ULSAN</text>
            <text x="600" y="30" fontSize="10" fill="var(--map-label)" fontFamily="var(--font-mono)" textAnchor="end">SINGAPORE</text>
          </svg>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-xs text-fg-muted">
            <span className="flex items-center gap-2">
              <svg width="12" height="12" viewBox="0 0 12 12"><path d="M0 12 L6 0 L12 12Z" fill="var(--vessel-ais)" /></svg>
              실제 AIS 수신 선박
            </span>
            <span className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 14 14"><path d="M7 1 l6 6 l-6 6 l-6 -6z" fill="none" stroke="var(--vessel-sim)" strokeWidth="1.75" strokeDasharray="2.5 2" /></svg>
              계획 항차(시뮬레이션)
            </span>
          </div>
        </Card>
      </Section>

      {/* ── 타이포 ───────────────────────────────────────────────── */}
      <Section id="type" title="타이포그래피" description="Pretendard Variable(한글·UI) + JetBrains Mono(숫자). keep-all · balance.">
        <Card className="space-y-6 overflow-hidden">
          <div>
            <CardLabel>display</CardLabel>
            <p className="type-display mt-3 text-fg">해상 오퍼레이션을 숫자로 끝냅니다</p>
          </div>
          <div>
            <CardLabel>h1</CardLabel>
            <p className="type-h1 mt-3 text-fg">Laytime · Demurrage 정산</p>
          </div>
          <div>
            <CardLabel>h2</CardLabel>
            <p className="type-h2 mt-3 text-fg">항구별 SOF 이벤트</p>
          </div>
          <div>
            <CardLabel>body</CardLabel>
            <p className="type-body mt-3 max-w-2xl text-fg">
              NOR 통지 후 6시간이 지나거나 접안이 끝난 시점 중 빠른 쪽부터 레이타임이 개시됩니다. 묘박지에서 부두로
              이동한 시간(shifting)은 기본적으로 제외합니다.
            </p>
          </div>
          <div>
            <CardLabel>num-xl</CardLabel>
            <p className="type-num-xl mt-3 text-fg">$15,000.00</p>
            <p className="num mt-2 text-sm text-fg-muted">0O 1Il 84h 00m · 13,006 MT · 128.60 m</p>
          </div>
        </Card>
      </Section>

      {/* ── 버튼·배지 ────────────────────────────────────────────── */}
      <Section id="buttons" title="버튼 · 배지">
        <Card className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">
              Laytime 계산 시작 <ArrowRight size={16} />
            </Button>
            <Button variant="secondary">Q88 올려보기</Button>
            <Button variant="ghost">취소</Button>
            <Button variant="primary" size="sm">
              작게
            </Button>
            <Button variant="secondary" size="sm">
              <Copy size={14} /> 복사
            </Button>
            <Button variant="secondary" size="icon" aria-label="설정">
              <SlidersHorizontal size={16} />
            </Button>
            <Button variant="primary" disabled>
              비활성
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>중립</Badge>
            <Badge tone="accent">accent</Badge>
            <Badge tone="up">상승</Badge>
            <Badge tone="down">하락</Badge>
            <Badge tone="warn" dot>
              기한 임박
            </Badge>
            <Badge tone="info">정보</Badge>
          </div>
        </Card>
        <Card>
          <CardHeader
            title="데이터 등급 배지"
            description="LIVE는 출처·원천 기준 시각·수집 시각·발표 주기를 받는다. 마우스를 올리면 전체 출처가 보인다. 아래 값은 표시 예시이며 실제 수집값이 아니다."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(
              [
                ["live", { source: "예시 소스", asOf: "2026-10-06T05:30:00Z", fetchedAt: "2026-10-06T05:32:00Z", cadence: "장중 연속", delay: "15분 지연" }],
                ["live", { source: "예시 소스", asOf: "2026-10-02T03:00:00Z", fetchedAt: "2026-10-06T00:10:00Z", cadence: "주 1회 · 금" }],
                ["stale", { source: "예시 소스", fetchedAt: "2026-10-05T23:00:00Z", cadence: "일 1회", error: "HTTP 503" }],
                ["nokey", { source: "기상청 API허브" }],
                ["calc", {}],
                ["demo", {}],
              ] as const
            ).map(([grade, p], i) => (
              <div key={i} className="space-y-2 rounded-lg border border-line bg-inset p-3">
                <DataBadge grade={grade} {...p} />
                <ProvenanceLine grade={grade} {...p} />
              </div>
            ))}
          </div>
        </Card>
      </Section>

      {/* ── 폼 ───────────────────────────────────────────────────── */}
      <Section id="form" title="입력" description="모든 계산기의 좌측 입력 패널에서 쓰는 컴포넌트. 데스크톱 40px · 모바일 44px.">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Card className="space-y-5 lg:col-span-5">
            <Field label="Laytime 방식">
              <Segmented
                aria-label="Laytime 방식"
                value={mode}
                onValueChange={setMode}
                options={[
                  { value: "fixed", label: "총 시간 고정" },
                  { value: "rate", label: "양하율 기준" },
                ]}
              />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="수량" hint="↑/↓ 1 · Shift+↑/↓ 10">
                <NumberInput value={qty} onValueChange={setQty} unit="MT" step={100} min={0} />
              </Field>
              <Field label="Demurrage rate" tip="용선계약(C/P)의 체선료율. 하루 단위, pro rata 적용. 예시값 · C/P 확인">
                <NumberInput value={rate} onValueChange={setRate} unit="$/day" step={500} min={0} />
              </Field>
            </div>
            <Field label="NOR tendered" hint="현지시각 24h · 2026-10-01 0800 형식도 허용">
              <DateTimeInput value={nor} onValueChange={setNor} />
            </Field>
            <Field label="UTC 오프셋">
              <Select defaultValue="+9">
                <option value="+9">UTC+09:00 (KST)</option>
                <option value="+8">UTC+08:00 (SGT)</option>
                <option value="+4">UTC+04:00 (GST)</option>
              </Select>
            </Field>
            <Field label="오류 상태" error="숫자를 입력하세요">
              <TextInput defaultValue="abc" />
            </Field>
            <Slider label="Worldscale" value={ws} min={50} max={300} step={2.5} onValueChange={setWs} format={{ prefix: "WS ", decimals: 1 }} />
            <Field label="SOF 붙여넣기">
              <TextArea rows={3} placeholder={"0800 NOR tendered\n2000 All fast"} />
            </Field>
          </Card>
          <div className="space-y-4 lg:col-span-7">
            <Card className="lg:sticky lg:top-24">
              <div className="flex items-start justify-between gap-4">
                <Stat
                  label="Demurrage"
                  value={demoValue}
                  format={{ prefix: "$", decimals: 2 }}
                  size="xl"
                  badge={<DataBadge grade="calc" />}
                />
              </div>
              <div className="mt-6 grid grid-cols-2 gap-6 border-t border-line pt-5 sm:grid-cols-4">
                <Stat label="허용" value={72} format={{ decimals: 2 }} unit="h" size="sm" />
                <Stat label="사용" value={84} format={{ decimals: 2 }} unit="h" size="sm" />
                <Stat label="초과" value={12} format={{ decimals: 2 }} unit="h" size="sm" delta={16.7} positiveIsGood={false} />
                <Stat label="클레임 기한" value={88} unit="일 남음" size="sm" hint="D-88" />
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => setDemoValue((v) => (v === 15000 ? 12500 : 15000))}>
                  값 바꾸기 (320ms 보간)
                </Button>
                <Button size="sm" variant="ghost" onClick={() => toast("정산서를 클립보드에 복사했습니다")}>
                  <Copy size={14} /> 토스트
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSheet("bottom")}>
                  하단 시트
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSheet("right")}>
                  계산 근거 패널
                </Button>
              </div>
              <p className="mt-5 text-sm text-fg-muted">
                <Term tip="Notice of Readiness — 본선이 하역 준비를 마쳤다는 통지. 통지 후 notice time이 지나면 레이타임이 개시된다.">
                  NOR
                </Term>
                과{" "}
                <Term tip="Statement of Facts — 항구에서 일어난 사건과 시각을 기록한 문서.">SOF</Term>에 마우스를 올리거나
                포커스하면 용어 설명이 열립니다.{" "}
                <Tooltip content="툴팁은 화면 가장자리에서 잘리지 않게 위치를 보정합니다." label="툴팁 예시" />
              </p>
            </Card>
          </div>
        </div>
      </Section>

      {/* ── 탭·표 ────────────────────────────────────────────────── */}
      <Section id="table" title="탭 · 표" description="표는 모바일에서도 카드로 접지 않고 가로 스크롤(첫 열 고정). 헤더를 눌러 정렬.">
        <Tabs
          aria-label="샘플 탭"
          items={[
            {
              value: "table",
              label: "정산 표",
              content: <DataTable caption="샘플 표" columns={SAMPLE_COLUMNS} rows={SAMPLE_ROWS} rowKey={(r) => r.id} maxHeight={320} />,
            },
            {
              value: "empty",
              label: "빈 상태",
              content: (
                <EmptyState
                  icon={Inbox}
                  title="저장된 계산이 없습니다"
                  description="계산 결과는 이 브라우저에 최근 10건까지 저장됩니다."
                  action={<Button size="sm">첫 계산 시작</Button>}
                />
              ),
            },
            {
              value: "loading",
              label: "로딩",
              content: (
                <Card className="space-y-3">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-9 w-48" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                </Card>
              ),
            },
          ]}
        />
      </Section>

      {/* ── 모션 ─────────────────────────────────────────────────── */}
      <Section id="motion" title="모션" description="뷰포트 진입 시 12px 상승 + 페이드, 형제 60ms 간격. 카드에 마우스를 올리면 경계 강조와 스포트라이트.">
        <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {["Laytime", "운임", "넷백", "수량환산", "일정", "Q88", "기상", "항로"].map((t, i) => (
            <StaggerItem key={t}>
              <Card interactive className="flex h-full flex-col gap-6">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-inset text-accent">
                  <FileText size={16} strokeWidth={1.75} />
                </span>
                <div>
                  <p className="font-semibold text-fg">{t}</p>
                  <p className="mt-1 text-xs text-fg-muted">
                    카운트업 <AnimatedNumber value={(i + 1) * 1250} from={0} delay={300} duration={900} className="text-fg" />
                  </p>
                </div>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
        <Reveal>
          <Card className="text-sm text-fg-muted">
            이 카드는 Reveal 단독 사용 예시입니다. <code className="num text-fg">prefers-reduced-motion: reduce</code>이면 즉시 표시됩니다.
          </Card>
        </Reveal>
      </Section>

      <Sheet
        open={sheet !== false}
        onOpenChange={(o) => !o && setSheet(false)}
        side={sheet === "right" ? "right" : "bottom"}
        title={sheet === "right" ? "계산 근거 · 가정" : "입력"}
        description={sheet === "right" ? "모든 기본값은 예시값입니다. C/P를 확인하세요." : "모바일 입력 패널"}
      >
        <div className="space-y-4">
          <Field label="허용 Laytime">
            <NumberInput value={72} onValueChange={() => {}} unit="h" />
          </Field>
          <p className="text-sm leading-relaxed text-fg-muted">
            개시 = min(NOR + notice time, All fast). 종료 = Hoses disconnected. Shifting은 기본 제외합니다.
          </p>
        </div>
      </Sheet>
    </div>
  );
}
