import { cn } from "@/lib/utils";

/**
 * 모든 계산기의 공통 골격(지시서 3.7): 좌 입력 5컬럼 / 우 결과 7컬럼(sticky).
 * 모바일에서는 입력 → 결과 순으로 쌓이고, mobileSummary가 있으면 하단 탭 위(태블릿은 화면 바닥)에 고정 바로 표시된다.
 */
export function CalculatorLayout({
  inputs,
  results,
  mobileSummary,
  className,
}: {
  inputs: React.ReactNode;
  results: React.ReactNode;
  /** 모바일 하단 고정 요약 (핵심 결과 1~2개) */
  mobileSummary?: React.ReactNode;
  className?: string;
}) {
  return (
    <>
      <div className={cn("grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-6", className)}>
        <section aria-label="입력" className="min-w-0 space-y-4 lg:col-span-5">
          {inputs}
        </section>
        <section aria-label="결과" className="min-w-0 lg:col-span-7">
          <div className="space-y-4 lg:sticky lg:top-24">{results}</div>
        </section>
      </div>
      {mobileSummary && (
        <div
          data-print-hidden
          data-mobile-summary=""
          className="fixed inset-x-0 bottom-[calc(56px+env(safe-area-inset-bottom))] z-30 border-t border-line-strong bg-[color-mix(in_oklab,var(--bg-raised)_94%,transparent)] px-4 py-3 backdrop-blur-md md:bottom-0 md:pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden"
        >
          {mobileSummary}
        </div>
      )}
    </>
  );
}
