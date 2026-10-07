import { ViewTransition } from "react";
import { cn } from "@/lib/utils";

/**
 * 모든 page.tsx의 최상위 래퍼: 페이지 전환(React <ViewTransition>) + 컨테이너.
 * 레이아웃이 아니라 페이지마다 감싼다 — 레이아웃은 전환 사이에 유지되어 enter/exit가 일어나지 않는다.
 * 지원하지 않는 브라우저에서는 즉시 전환. 헤더는 viewTransitionName으로 고정(globals.css).
 * bleed: 홈처럼 섹션이 화면 끝까지 나가야 할 때 컨테이너를 빼고 섹션이 직접 container-page를 쓴다.
 */
export function PageShell({
  children,
  bleed = false,
  className,
}: {
  children: React.ReactNode;
  bleed?: boolean;
  className?: string;
}) {
  return (
    <ViewTransition enter="oi-page-in" exit="oi-page-out" default="none">
      <div className={cn(!bleed && "container-page", className)}>{children}</div>
    </ViewTransition>
  );
}
