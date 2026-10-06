"use client";

import { useEffect } from "react";

// [data-spotlight] 요소 위에서 포인터 위치를 CSS 변수(--mx, --my)로 넘긴다.
// 요소마다 리스너를 달지 않고 문서에 하나만 둔다.
export function SpotlightTracker() {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover)").matches) return;
    let frame = 0;
    let last: PointerEvent | null = null;

    function apply() {
      frame = 0;
      if (!last) return;
      const target = (last.target as Element | null)?.closest?.("[data-spotlight]") as HTMLElement | null;
      if (!target) return;
      const rect = target.getBoundingClientRect();
      target.style.setProperty("--mx", `${last.clientX - rect.left}px`);
      target.style.setProperty("--my", `${last.clientY - rect.top}px`);
    }

    function onMove(e: PointerEvent) {
      last = e;
      if (!frame) frame = requestAnimationFrame(apply);
    }

    document.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      document.removeEventListener("pointermove", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
