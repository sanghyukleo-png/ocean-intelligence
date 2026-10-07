"use client";

import { useState } from "react";
import { CircleHelp } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export function AssumptionsButton({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open}>
        <CircleHelp size={15} strokeWidth={1.75} aria-hidden="true" />
        {title}
      </Button>
      <Sheet open={open} onOpenChange={setOpen} side="right" title={title}>
        <div className="space-y-4 text-sm leading-relaxed text-fg-muted [&_strong]:font-semibold [&_strong]:text-fg">
          {children}
        </div>
      </Sheet>
    </>
  );
}
