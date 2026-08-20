import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border py-8">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-2 px-6 text-center text-xs text-muted">
        <p>
          개인 AI 제품 프로젝트 — 석유화학 시장 인텔리전스
          <span className="mx-1.5 text-border">→</span>글로벌 B2B 영업
          <span className="mx-1.5 text-border">→</span>상업적 분석
          <span className="mx-1.5 text-border">→</span>해양·조선 인텔리전스
        </p>
        <p>
          화면에 표시된 모든 시황·선박·고객 데이터는 데모 목적의 시뮬레이션입니다.{" "}
          <Link href="/about" className="text-accent hover:underline">
            이 프로젝트 소개
          </Link>
        </p>
      </div>
    </footer>
  );
}
