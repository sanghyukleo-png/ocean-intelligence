import type { Metadata, Viewport } from "next";
import "./globals.css";
import { pretendard, pretendardExt, jetbrainsMono } from "./fonts";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import { SiteHeader } from "@/components/shell/site-header";
import { SiteFooter } from "@/components/shell/site-footer";
import { MobileTabBar } from "@/components/shell/mobile-tab-bar";
import { CommandPalette } from "@/components/shell/command-palette";
import { Backdrop } from "@/components/shell/backdrop";
import { SpotlightTracker } from "@/components/shell/spotlight-tracker";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "OCEAN INTELLIGENCE — Marine Operations Desk",
    template: "%s · OCEAN INTELLIGENCE",
  },
  description:
    "정유·석유화학 해상 오퍼레이션 데스크. Laytime·Demurrage 정산, 운임·넷백 계산, Q88 선박 적합성 검토, 항만 기상을 한 곳에서.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#070B14" },
    { media: "(prefers-color-scheme: light)", color: "#F6F8FB" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      data-theme="dark"
      suppressHydrationWarning
      className={`${pretendard.variable} ${pretendardExt.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <noscript>
          <style>{"[data-reveal]{opacity:1!important;transform:none!important}"}</style>
        </noscript>
      </head>
      <body className="min-h-dvh">
        <Backdrop />
        <SpotlightTracker />
        <ToastProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-raised focus:px-4 focus:py-2 focus:text-sm focus:text-fg"
          >
            본문으로 건너뛰기
          </a>
          <SiteHeader />
          <main id="main" className="pb-8">
            {children}
          </main>
          <SiteFooter />
          <MobileTabBar />
          <CommandPalette />
        </ToastProvider>
      </body>
    </html>
  );
}
