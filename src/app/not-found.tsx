import type { Metadata } from "next";
import Link from "next/link";
import { Home } from "lucide-react";
import { PageShell } from "@/components/shell/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { NavTile } from "@/components/shell/nav-tile";
import { CommandPaletteTrigger } from "@/components/shell/command-palette";
import { ABOUT_ITEM, ALL_NAV_ITEMS } from "@/lib/nav";

// 루트 not-found: notFound() 호출과 매칭되지 않는 모든 URL을 처리한다(루트 레이아웃 안에서 렌더).
// 서버 컴포넌트로 두어 metadata(문서 제목)를 내보낸다 — 클라이언트로 바꾸면 레이아웃 기본 제목이 남는다.
// NavTile은 서버에서도 렌더되는 공용 컴포넌트라 아이콘 함수를 그대로 쓸 수 있다.

export const metadata: Metadata = {
  title: "페이지를 찾을 수 없습니다",
};

/** 작동하는 도구를 먼저, 모자라면 준비 중 도구로 6칸을 채운다 */
const SUGGESTIONS = [
  ...ALL_NAV_ITEMS.filter((i) => i.status === "ready" && i !== ABOUT_ITEM),
  ...ALL_NAV_ITEMS.filter((i) => i.status === "soon"),
].slice(0, 6);

export default function NotFound() {
  return (
    <PageShell>
      {/* 좌우 배치는 xl부터 — 1024에서는 7칸 카드 안의 2열 도구 설명이 두 줄로 깨진다 */}
      <div className="grid gap-10 pb-8 pt-10 md:pt-16 xl:grid-cols-12 xl:gap-16 xl:pt-24">
        <div className="xl:col-span-5">
          <p className="type-label text-accent">404</p>
          <h1 className="type-h1 mt-3 text-fg">페이지를 찾을 수 없습니다</h1>
          <p className="type-body mt-3 text-balance text-fg-muted">
            주소가 바뀌었거나 존재하지 않는 화면입니다. 홈이나 주요 도구에서 다시 시작하세요.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-3">
            <Link href="/" className={buttonVariants({ variant: "primary" })}>
              <Home size={16} strokeWidth={1.75} aria-hidden="true" />
              홈으로
            </Link>
            <CommandPaletteTrigger label="전체 도구 검색" />
          </div>
        </div>

        <section aria-labelledby="not-found-tools" className="surface-card overflow-hidden xl:col-span-7">
          <h2 id="not-found-tools" className="type-label border-b border-line px-5 py-4 text-fg-label">
            주요 도구
          </h2>
          <ul className="grid gap-1 p-2 sm:grid-cols-2">
            {SUGGESTIONS.map((item) => (
              <li key={item.href}>
                <NavTile item={item} className="h-full" />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </PageShell>
  );
}
