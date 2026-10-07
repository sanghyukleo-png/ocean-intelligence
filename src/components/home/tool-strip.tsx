import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { HOME_TOOL_STRIP } from "@/lib/nav";
import { LastResult } from "@/components/home/recent-work";
import { cn } from "@/lib/utils";

/** 히어로 하단 도구 스트립 6개 (지시서 4.1-5) */
export function ToolStrip({ className }: { className?: string }) {
  return (
    <nav aria-label="오퍼레이션 도구" className={className}>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {HOME_TOOL_STRIP.map((tool, i) => {
          const Icon = tool.icon;
          return (
            <li key={tool.href} className="intro-fade" style={{ "--d": `${700 + i * 40}ms` } as React.CSSProperties}>
              <Link
                href={tool.href}
                data-spotlight=""
                className="surface-card group flex h-full min-h-[7.5rem] flex-col justify-between gap-4 p-4"
              >
                <span className="flex items-start justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-inset text-fg-muted transition-colors group-hover:text-accent">
                    <Icon size={17} strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  <ArrowUpRight
                    size={16}
                    aria-hidden="true"
                    className="text-fg-faint transition-[color,transform] duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-fg"
                  />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-fg">{tool.label}</span>
                  <span className={cn("mt-1 block text-xs leading-snug text-fg-muted")}>
                    <LastResult
                      tool={tool.href}
                      fallback={tool.status === "soon" ? "준비 중" : tool.description}
                    />
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
