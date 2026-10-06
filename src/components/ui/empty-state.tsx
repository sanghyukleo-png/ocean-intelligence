import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line-strong px-6 py-10 text-center",
        className
      )}
    >
      {Icon && (
        <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-inset text-fg-muted">
          <Icon size={18} strokeWidth={1.75} />
        </span>
      )}
      <div className="max-w-sm space-y-1">
        <p className="text-sm font-semibold text-fg">{title}</p>
        {description && <p className="text-[0.8125rem] leading-relaxed text-fg-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
