import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { ABOUT_ITEM, MARKET_ITEM, OPS_TOOLS, SHIPBUILDING_ITEMS, VESSEL_ITEMS, VOYAGE_ITEM, type NavItem } from "@/lib/nav";

const COLUMNS: { title: string; items: NavItem[] }[] = [
  { title: "오퍼레이션", items: OPS_TOOLS },
  { title: "선박 · 항차", items: [...VESSEL_ITEMS, VOYAGE_ITEM] },
  { title: "시장", items: [MARKET_ITEM, ...SHIPBUILDING_ITEMS] },
];

export function SiteFooter() {
  return (
    <footer data-print-hidden className="mt-24 border-t border-line pb-24 pt-12 md:pb-12">
      <div className="container-page grid gap-10 md:grid-cols-12">
        <div className="space-y-4 md:col-span-4">
          <Logo />
          <p className="max-w-sm text-sm leading-relaxed text-fg-muted">
            정유·석유화학 선적·용선·수출입 실무를 위한 해상 오퍼레이션 데스크.
          </p>
          <ul className="space-y-2 text-xs leading-relaxed text-fg-muted">
            <li>모든 수치에 LIVE · 입력값 계산 · DEMO 등급을 표기합니다.</li>
            <li>계산은 결정론적 코드가 하고, AI는 설명과 초안만 씁니다.</li>
            <li>기본값은 예시입니다. 실제 용선계약(C/P)·터미널 규정을 확인하십시오.</li>
          </ul>
        </div>
        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title} className="md:col-span-2">
            <p className="type-label mb-4 text-fg-label">{col.title}</p>
            <ul className="space-y-3">
              {col.items.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-fg-muted transition-colors hover:text-fg">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
        <nav aria-label="프로젝트" className="md:col-span-2">
          <p className="type-label mb-4 text-fg-label">프로젝트</p>
          <ul className="space-y-3">
            <li>
              <Link href={ABOUT_ITEM.href} className="text-sm text-fg-muted transition-colors hover:text-fg">
                소개 · 설계 원칙
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="container-page mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6 text-xs text-fg-muted">
        <p>© 2026 OCEAN INTELLIGENCE</p>
        <p>본 도구의 결과는 검산·의사결정 보조용이며 계약상 정산·공식 통제를 대신하지 않습니다.</p>
      </div>
    </footer>
  );
}
