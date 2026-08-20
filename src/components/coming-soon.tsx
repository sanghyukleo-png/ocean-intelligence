import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

export function ComingSoon({
  icon: Icon,
  eyebrow,
  title,
  description,
  pipeline,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  pipeline: string[];
}) {
  return (
    <div className="space-y-8">
      <section>
        <p className="text-xs font-medium tracking-[0.16em] text-accent">{eyebrow}</p>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">{description}</p>
      </section>

      <Card className="flex flex-col items-center gap-4 border-dashed py-16 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-accent">
          <Icon size={20} />
        </span>
        <div>
          <p className="text-sm font-medium text-foreground">Module in development</p>
          <p className="mt-1 max-w-sm text-xs text-muted">
            This module is scoped for the next build phase and is not part of the current MVP
            release.
          </p>
        </div>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          {pipeline.map((step, i) => (
            <span
              key={step}
              className="rounded border border-border bg-surface-2 px-2 py-1 text-[10px] text-muted"
            >
              {i + 1}. {step}
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
}
