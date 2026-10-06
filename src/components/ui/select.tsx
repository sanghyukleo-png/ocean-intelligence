"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { inputBase, useField } from "@/components/ui/field";

export function Select({
  className,
  id,
  children,
  ...props
}: React.ComponentProps<"select">) {
  const field = useField();
  return (
    <div className={cn("relative", className)}>
      <select
        id={id ?? field?.id}
        aria-describedby={field?.describedBy}
        aria-invalid={field?.invalid || undefined}
        className={cn(inputBase, "cursor-pointer appearance-none pr-9")}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        size={16}
        strokeWidth={1.75}
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-fg-muted"
      />
    </div>
  );
}
