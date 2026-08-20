import { LucideIcon } from "lucide-react";

export function PageIntro({
  icon: Icon,
  eyebrow,
  title,
  purpose,
  howItWorks,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  purpose: string;
  howItWorks: string;
}) {
  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs font-semibold tracking-[0.16em] text-accent">{eyebrow}</p>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">{title}</h1>
      </div>
      <div className="rounded-lg border border-border bg-surface-2/60 p-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent/15 text-accent">
            <Icon size={15} />
          </span>
          <div className="space-y-1.5 text-sm leading-relaxed">
            <p>
              <span className="font-semibold text-foreground">이 화면이 보여주는 것: </span>
              <span className="text-muted">{purpose}</span>
            </p>
            <p>
              <span className="font-semibold text-foreground">핵심 작동 방법: </span>
              <span className="text-muted">{howItWorks}</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
