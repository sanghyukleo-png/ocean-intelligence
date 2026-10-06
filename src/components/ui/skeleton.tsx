import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("oi-skeleton h-4 rounded-md", className)} />;
}
