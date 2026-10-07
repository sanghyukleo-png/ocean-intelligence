"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 네이티브 <dialog> 기반 시트 — 포커스 가두기·Esc·배경 inert를 브라우저가 처리한다.
 * side="bottom": 모바일 입력 패널, side="right": 계산 근거·가정 패널
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  side = "bottom",
  children,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  side?: "bottom" | "right";
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onClose={() => onOpenChange(false)}
      onClick={(e) => {
        // 배경(backdrop) 클릭 시 닫기
        if (e.target === e.currentTarget) onOpenChange(false);
      }}
      className={cn(
        "m-0 max-h-none max-w-none border-line-strong bg-raised p-0 text-fg backdrop:bg-[rgb(3_6_12/0.6)] backdrop:backdrop-blur-[2px]",
        "transition-[transform,opacity,overlay,display] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] transition-discrete",
        side === "bottom"
          ? "inset-x-0 bottom-0 top-auto max-h-[85dvh] w-full rounded-t-xl border-t starting:translate-y-full [&:not([open])]:translate-y-full"
          : "inset-y-0 left-auto right-0 h-dvh w-[min(28rem,100vw)] border-l starting:translate-x-full [&:not([open])]:translate-x-full",
        className
      )}
    >
      <div className={cn("flex h-full flex-col", side === "bottom" && "max-h-[85dvh]")}>
        {side === "bottom" && <div aria-hidden="true" className="mx-auto mt-2 h-1 w-10 rounded-full bg-line-strong" />}
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-semibold text-fg">
              {title}
            </h2>
            {description && (
              <p id={descId} className="mt-1 text-[0.8125rem] text-fg-muted">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="닫기"
            className="-mr-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-fg-muted hover:bg-subtle hover:text-fg md:h-9 md:w-9"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>
        {/* 내용이 길면 스크롤된다 — 키보드로도 스크롤할 수 있게 포커스를 받는다 */}
        <div
          tabIndex={0}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
          {children}
        </div>
      </div>
    </dialog>
  );
}
