import { Card } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <section>
        <p className="text-xs font-medium tracking-[0.16em] text-accent">이 프로젝트 소개</p>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">
          왜 석유화학 트레이더가 해양 인텔리전스 제품을 만들었는가
        </h1>
      </section>

      <Card className="space-y-4 text-sm leading-relaxed text-foreground">
        <p>
          저는 글로벌 석유화학 기업의 SM/BTX 영업팀에서 4년 5개월간 근무하며, 스티렌모노머(SM)
          약 577KTA와 MMA 50KTA 물량을 대상으로 내수 탱크로리 영업과 수출 벌크선 계약(COA 및
          스팟)을 담당했습니다. 실무는 ICIS/Platts 가격 시그널을 읽고 지역 간 아비트라지
          구조를 설계하며, 선박을 노미네이션하고 터미널 물류를 조율하고, 해외 바이어를 대상으로
          L/C 기반 신용리스크를 관리하는 일이었습니다 — 여기에는 중동발 지역 공급 충격으로
          촉발된 벤젠 쇼티지 급등 대응 경험도 포함됩니다.
        </p>
        <p>
          이 업무의 본질은 시장 인텔리전스를 상업적 의사결정으로 연결하는 것입니다: 어떤
          고객사를 우선할지, 언제 선복을 확보할지, 변동하는 운임·원료 여건 속에서 화물 가격을
          어떻게 책정할지. OCEAN INTELLIGENCE는 이 동일한 사고방식이 조선 영업기획 실무에도
          그대로 적용될 수 있음을 보여주기 위한 시도입니다 — 과거 벤젠-스티렌 스프레드를 읽던
          방식으로 선령·발주잔량 시그널을 읽고, 이를 스프레드시트가 아닌 등급화되고 설명 가능한
          영업 파이프라인으로 전환합니다.
        </p>
        <p>
          이 제품의 모든 수치는 결정론적 계산(영업기회 점수, TCE 계산기) 또는 명확히 표시된
          데모 데이터입니다 — 실시간 시장 정보를 표방하는 항목은 없습니다. AI 레이어는 설명하고
          초안을 작성할 뿐, 결정하지 않습니다. 이러한 분리는 의도적인 설계로, 실제 영업기획
          도구가 갖춰야 할 원칙을 반영한 것입니다.
        </p>
        <p className="text-muted">
          Next.js, TypeScript, Tailwind CSS로 구축했으며, 석유화학 트레이딩에서 해양·조선
          상업 직무로의 전환을 준비하는 과정에서 자기주도적으로 진행한 프로젝트입니다. 데이터
          파이프라인은 데모 데이터를 실제 백엔드(Supabase)로 교체할 때 UI 재작성 없이 연결될
          수 있도록 설계되어 있습니다.
        </p>
      </Card>
    </div>
  );
}
