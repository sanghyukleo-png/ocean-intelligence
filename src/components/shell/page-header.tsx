import { AssumptionsButton } from "@/components/shell/assumptions-button";
import { cn } from "@/lib/utils";

/**
 * 페이지 머리: 라벨 + 제목 + 한 줄 설명 + (선택) 우측 ? 버튼(계산 근거·가정 패널) + 액션.
 * 기존 PageIntro의 "이 화면이 보여주는 것" 박스를 대체한다(지시서 3.7).
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  assumptions,
  assumptionsTitle = "계산 근거 · 가정",
  actions,
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** ? 버튼을 누르면 오른쪽 패널에 열리는 내용 */
  assumptions?: React.ReactNode;
  assumptionsTitle?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-wrap items-end justify-between gap-x-6 gap-y-4 pb-8 pt-4 md:pt-8", className)}>
      <div className="min-w-0 max-w-3xl">
        {eyebrow && <p className="type-label text-accent">{eyebrow}</p>}
        <h1 className={cn("type-h1 text-fg", eyebrow && "mt-3")}>{title}</h1>
        {description && <p className="mt-3 text-[0.9375rem] leading-relaxed text-fg-muted">{description}</p>}
      </div>
      {(assumptions || actions) && (
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {actions}
          {assumptions && <AssumptionsButton title={assumptionsTitle}>{assumptions}</AssumptionsButton>}
        </div>
      )}
    </header>
  );
}
