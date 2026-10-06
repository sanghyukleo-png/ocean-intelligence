import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

export function Card({
  className,
  interactive = false,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  /** 호버 시 경계 강조 + 포인터 스포트라이트 */
  interactive?: boolean;
}) {
  return (
    <div
      data-spotlight={interactive ? "" : undefined}
      className={cn("surface-card p-5", className)}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  description,
  actions,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        <h3 className="text-[0.9375rem] font-semibold leading-snug text-fg">{title}</h3>
        {description && <p className="mt-1 text-[0.8125rem] leading-relaxed text-fg-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export function CardLabel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("type-label text-fg-muted", className)} {...props} />;
}
