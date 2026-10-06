"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 용어 설명 툴팁. 호버·포커스로 열리고 Esc로 닫힌다. 터치에서는 탭으로 토글.
 * 화면 가장자리에서 잘리지 않도록 열릴 때 가로 위치를 보정한다.
 */
export function Tooltip({
  content,
  children,
  label = "설명",
  side = "top",
  className,
}: {
  content: React.ReactNode;
  /** 트리거. 없으면 ? 아이콘 버튼 */
  children?: React.ReactNode;
  /** 아이콘 트리거의 접근성 이름 */
  label?: string;
  side?: "top" | "bottom";
  className?: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [shift, setShift] = useState(0);
  const bubble = useRef<HTMLSpanElement>(null);
  const wrapper = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    if (!open || !bubble.current) return;
    const rect = bubble.current.getBoundingClientRect();
    const gutter = 12;
    const vw = document.documentElement.clientWidth;
    let dx = 0;
    if (rect.left < gutter) dx = gutter - rect.left;
    else if (rect.right > vw - gutter) dx = vw - gutter - rect.right;
    setShift((prev) => prev + dx);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: PointerEvent) => {
      if (!wrapper.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  const show = () => setOpen(true);
  const hide = () => {
    setOpen(false);
    setShift(0);
  };

  return (
    <span
      ref={wrapper}
      className={cn("relative inline-flex", className)}
      onPointerEnter={(e) => e.pointerType === "mouse" && show()}
      onPointerLeave={(e) => e.pointerType === "mouse" && hide()}
      onFocus={show}
      onBlur={hide}
    >
      {children ? (
        <span aria-describedby={open ? id : undefined} tabIndex={0} className="cursor-help rounded-sm">
          {children}
        </span>
      ) : (
        <button
          type="button"
          aria-label={label}
          aria-describedby={open ? id : undefined}
          aria-expanded={open}
          onClick={() => (open ? hide() : show())}
          className="-m-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full text-fg-faint transition-colors hover:text-fg"
        >
          <HelpCircle size={14} strokeWidth={1.75} />
        </button>
      )}
      <span
        ref={bubble}
        id={id}
        role="tooltip"
        hidden={!open}
        style={{ transform: `translateX(calc(-50% + ${shift}px))` }}
        className={cn(
          "absolute left-1/2 z-50 w-max max-w-[min(18rem,calc(100vw-24px))] rounded-lg border border-line-strong bg-raised px-3 py-2 text-left text-xs font-normal normal-case leading-relaxed tracking-normal text-fg shadow-[0_8px_24px_rgb(0_0_0/0.28)]",
          side === "top" ? "bottom-[calc(100%+8px)]" : "top-[calc(100%+8px)]"
        )}
      >
        {content}
      </span>
    </span>
  );
}

/** 본문 속 용어: 점선 밑줄 + 툴팁 */
export function Term({ children, tip }: { children: React.ReactNode; tip: React.ReactNode }) {
  return (
    <Tooltip content={tip}>
      <span className="underline decoration-fg-faint decoration-dotted underline-offset-4">{children}</span>
    </Tooltip>
  );
}
