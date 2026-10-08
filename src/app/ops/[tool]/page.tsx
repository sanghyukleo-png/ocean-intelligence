import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { PageShell } from "@/components/shell/page-shell";
import { Card } from "@/components/ui/card";
import { OPS_TOOLS, VESSEL_ITEMS, VOYAGE_ITEM } from "@/lib/nav";

// 각 도구의 실제 화면이 준비되면 같은 경로에 정적 page.tsx를 추가한다(정적 세그먼트가 이 동적 경로보다 우선).
// 그 전까지는 제공 예정 범위를 정직하게 보여주는 진행 현황 페이지.

const SCOPE: Record<string, string[]> = {
  laytime: [
    "항구별 SOF 시각(현지시각 + UTC 오프셋) 입력과 줄 단위 붙여넣기 파싱",
    "NOR + notice time · All fast 개시 규칙, shifting·기상 등 공제(0/50/100%)",
    "허용·사용·초과 시간, 체선료 금액, 클레임 기한 D-day",
    "타임라인 바, 영문 Laytime Statement · 클레임 레터 초안, A4 정산서 인쇄",
  ],
  freight: [
    "Worldscale(Flat × WS) · Lumpsum · $/MT · $/bbl 상호 환산",
    "최소 수량 미달 deadfreight, 초과분 overage, differential",
    "주소 수수료·중개 수수료 반영 순운임, 최대 4안 비교",
  ],
  netback: [
    "도착지 최대 5곳의 FOB 넷백 비교와 손익분기 운임",
    "수입 방향 도착 원가 토글, 운임·도착가 민감도 히트맵",
  ],
  quantity: [
    "API ↔ 비중 ↔ 밀도 15°C, ASTM Table 54A/54B/54D VCF",
    "GOV → GSV → 중량(진공·공기 중) → bbl, 가격 단위 환산",
    "B/L · 본선 · 양하 수량 대조",
  ],
  schedule: [
    "Laycan·B/L일·가격 조항·결제 조건으로 날짜순 체크리스트",
    "인코텀즈별 선적 서류, 포뮬러 프라이싱 평균가 계산, .ics 내보내기",
  ],
  weather: [
    "기상청 특보·예비특보·해상예보 기반 국내 12개 항만 위험 등급",
    "등급별 근거(발표 시각·유효 기간·통보문 원문)와 선적 일정 겹쳐 보기",
  ],
  route: [
    "지도에서 선적항·도착지·선형을 골라 리드타임·운임·넷백 동시 계산",
    "운하·해협 통과 제약 스위치, 속력·기항 순서 최적화",
  ],
};

export const dynamicParams = false;

export function generateStaticParams() {
  // 화면이 준비된 도구는 같은 경로의 정적 page.tsx가 맡는다
  return OPS_TOOLS.filter((t) => t.status === "soon").map((t) => ({ tool: t.href.split("/").pop()! }));
}

export async function generateMetadata({ params }: { params: Promise<{ tool: string }> }): Promise<Metadata> {
  const { tool } = await params;
  const item = OPS_TOOLS.find((t) => t.href === `/ops/${tool}`);
  return { title: item?.label ?? "오퍼레이션" };
}

export default async function OpsToolPage({ params }: { params: Promise<{ tool: string }> }) {
  const { tool } = await params;
  const item = OPS_TOOLS.find((t) => t.href === `/ops/${tool}`);
  if (!item) notFound();
  const Icon = item.icon;
  const ready = [VOYAGE_ITEM, ...VESSEL_ITEMS];

  return (
    <PageShell>
      <PageHeader eyebrow={`OPERATIONS · ${item.en.toUpperCase()}`} title={item.label} description={item.description} />
      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <div className="flex items-start gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line bg-inset text-accent">
              <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="type-h2 text-fg">준비 중</h2>
              <p className="mt-2 text-sm leading-relaxed text-fg-muted">
                계산 엔진의 검증 테스트가 통과한 뒤에 화면을 엽니다. 제공 예정 범위:
              </p>
              <ul className="mt-4 space-y-3">
                {(SCOPE[tool] ?? []).map((line) => (
                  <li key={line} className="flex gap-3 text-sm leading-relaxed text-fg">
                    <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
        <div className="space-y-3 lg:col-span-5">
          <p className="type-label text-fg-label">지금 쓸 수 있는 도구</p>
          {ready.map((r) => (
            <Link
              key={r.href}
              href={r.href}
              data-spotlight=""
              className="surface-card flex items-center justify-between gap-4 p-4 transition-colors"
            >
              <span className="min-w-0">
                <span className="block text-sm font-medium text-fg">{r.label}</span>
                <span className="block text-[0.8125rem] text-fg-muted">{r.description}</span>
              </span>
              <ArrowRight size={16} aria-hidden="true" className="shrink-0 text-fg-muted" />
            </Link>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
