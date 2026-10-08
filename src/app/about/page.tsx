import type { Metadata } from "next";
import { Calculator, MessageSquareText, Tags, type LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { PageShell } from "@/components/shell/page-shell";
import { Reveal } from "@/components/motion/reveal";
import { Card } from "@/components/ui/card";
import { Badge, DataBadge, type DataGrade } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "소개",
  description: "석유화학 영업 실무에서 출발한 프로젝트의 배경과 설계 원칙.",
};

// 포지셔닝: 정유·석유화학 해상 오퍼레이션 데스크(2026-10-08 가상 데이터 제거와 함께 갱신). 전면 개편은 Phase 6.

const PRACTICE: string[] = [
  "ICIS/Platts 가격 시그널을 읽고 지역 간 아비트라지 구조 설계",
  "선박 노미네이션과 터미널 물류 조율",
  "해외 바이어 대상 L/C 기반 신용리스크 관리",
  "중동발 지역 공급 충격으로 촉발된 벤젠 쇼티지 급등 대응",
];

const PRINCIPLES: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Calculator,
    title: "결정론적 계산",
    body: "TCE·크랙 스프레드·항만 위험 등급 같은 수치는 정해진 식과 입력값으로 계산합니다. 같은 입력이면 같은 결과가 나옵니다.",
  },
  {
    icon: Tags,
    title: "데이터 등급 표기",
    body: "모든 수치에 데이터 등급과 출처·기준 시각을 붙입니다. 가상·예시 데이터는 쓰지 않고, 수집하지 못한 값은 지어내지 않고 상태를 그대로 보여 줍니다.",
  },
  {
    icon: MessageSquareText,
    title: "AI는 설명만",
    body: "AI 레이어는 설명하고 초안을 작성할 뿐, 결정하지 않습니다.",
  },
];

// badge.tsx의 DataGrade 전체 — 홈 티커·시황에서 쓰는 상태 배지도 여기서 뜻을 찾을 수 있어야 한다
const GRADES: { grade: DataGrade; meaning: string; note?: string }[] = [
  { grade: "live", meaning: "외부 소스에서 수집한 값", note: "출처와 기준 시각을 함께 표시" },
  { grade: "stale", meaning: "수집에 실패한 항목", note: "마지막 성공값과 수집 시각, 실패 사유를 표시" },
  { grade: "nokey", meaning: "API 키가 없어 수집하지 않은 항목", note: "값 없이 상태만 표시" },
  { grade: "pending", meaning: "데이터 소스 연결 전인 항목", note: "가짜 값으로 채우지 않음" },
  { grade: "calc", meaning: "사용자 입력값으로 계산한 결과" },
  { grade: "input", meaning: "사용자가 직접 입력한 시세", note: "수집하지 않는 값(벙커가 등) · 이 브라우저에만 저장" },
];

const STACK = ["Next.js", "TypeScript", "Tailwind CSS", "MapLibre", "Vitest"];

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="space-y-4">
      <h2 id={id} className="type-h2 text-fg">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function AboutPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="ABOUT"
        title="왜 석유화학 트레이더가 해양 인텔리전스 제품을 만들었는가"
        description="석유화학 영업 실무에서 출발한 프로젝트의 배경과 설계 원칙."
      />

      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <article className="type-body max-w-[68ch] space-y-12 text-fg lg:col-span-7">
          <Section id="about-background" title="배경">
            <p>
              {/* 괄호·가운뎃점 앞뒤는 keep-all에서도 줄이 바뀌므로 해당 어절은 nowrap으로 묶는다 */}
              글로벌 석유화학 기업의 SM/BTX 영업팀에서 4년 5개월간 근무하며,{" "}
              <span className="whitespace-nowrap">스티렌모노머(SM)</span> 약 577KTA와 MMA 50KTA 물량의 내수 탱크로리
              영업과 수출 벌크선 <span className="whitespace-nowrap">계약(COA·스팟)을</span> 담당했습니다.
            </p>
            <p className="text-fg-muted">맡았던 실무는 다음과 같습니다.</p>
            <ul className="space-y-2">
              {PRACTICE.map((line) => (
                <li key={line} className="flex gap-3">
                  {/* 점을 첫 줄(24px) 가운데에 맞춘다 */}
                  <span aria-hidden="true" className="flex h-6 shrink-0 items-center">
                    <span className="h-1 w-1 rounded-full bg-accent" />
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section id="about-why" title="같은 사고방식, 다른 시장">
            <p className="border-l-2 border-accent pl-4 font-medium">
              이 업무의 본질은 시장 인텔리전스를 상업적 의사결정으로 연결하는 것입니다.
            </p>
            <p>
              어떤 고객사를 우선할지, 언제 선복을 확보할지, 변동하는 운임·원료 여건 속에서 화물 가격을 어떻게
              책정할지가 그 의사결정입니다.
            </p>
            <p>
              OCEAN INTELLIGENCE는 이 사고방식을 정유·석유화학의 해상 오퍼레이션으로 옮긴 데스크입니다. 공개 소스에서
              유가·석유제품·환율·운임·항만 기상을 모아 출처와 기준 시각을 붙이고, 용선·선적·수출 실무의 계산을 같은 화면에서
              끝내도록 만듭니다.
            </p>
          </Section>

          <Section id="about-build" title="만든 방식">
            <p>
              석유화학 트레이딩 실무를 바탕으로 자기주도적으로 진행한 프로젝트입니다. 수집 소스마다 이용약관을 확인했고,
              API 키가 없거나 수집에 실패한 지표는 값을 비우고 이유를 표시합니다. 수집 상태는 데이터 수집 상태 화면에서 볼 수
              있습니다.
            </p>
            <ul aria-label="사용 기술" className="flex flex-wrap gap-2 pt-1">
              {STACK.map((s) => (
                <li key={s}>
                  <Badge>{s}</Badge>
                </li>
              ))}
            </ul>
          </Section>
        </article>

        <aside aria-labelledby="about-principles" className="lg:col-span-5">
          <Reveal className="lg:sticky lg:top-24">
            <Card className="p-6">
              <p className="type-label text-accent">PRINCIPLES</p>
              <h2 id="about-principles" className="type-h2 mt-3 text-fg">
                설계 원칙
              </h2>
              <p className="mt-2 text-balance text-sm leading-relaxed text-fg-muted">
                계산·표기·설명을 의도적으로 분리했습니다. 실무 도구가 갖춰야 할 원칙입니다.
              </p>

              <ol className="mt-6 space-y-6">
                {PRINCIPLES.map((p, i) => {
                  const Icon = p.icon;
                  return (
                    <li key={p.title} className="flex gap-4">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-inset text-accent">
                        <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="flex items-baseline gap-2 text-[0.9375rem] font-semibold leading-snug text-fg">
                          <span aria-hidden="true" className="num text-xs font-medium text-fg-muted">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          {p.title}
                        </h3>
                        <p className="mt-1 text-sm leading-relaxed text-fg-muted">{p.body}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>

              <div className="mt-6 border-t border-line pt-5">
                <p id="about-grades" className="type-label text-fg-label">
                  데이터 등급
                </p>
                {/* 배지 폭이 등급마다 달라 열 폭은 가장 넓은 배지에 맞춘다(subgrid로 행 간 정렬 유지) */}
                <dl aria-labelledby="about-grades" className="mt-4 grid grid-cols-[max-content_1fr] gap-x-3 gap-y-3">
                  {GRADES.map((g) => (
                    <div key={g.grade} className="col-span-2 grid grid-cols-subgrid items-start">
                      <dt>
                        <DataBadge grade={g.grade} />
                      </dt>
                      <dd className="text-[0.8125rem] leading-relaxed">
                        <span className="block text-fg">{g.meaning}</span>
                        {g.note && <span className="block text-fg-muted">{g.note}</span>}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </Card>
          </Reveal>
        </aside>
      </div>
    </PageShell>
  );
}
