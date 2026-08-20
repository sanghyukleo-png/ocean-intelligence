import type { Metadata } from "next";
import "./globals.css";
import { NavBar } from "@/components/nav-bar";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "OCEAN INTELLIGENCE — AI 기반 해양·조선 시장 및 영업 인텔리전스",
  description:
    "선박 영업기획을 위한 시황 인텔리전스, 선박 데이터 분석, 영업기회 스코어링을 데이터 기반으로 시연하는 해양 상업 인텔리전스 포트폴리오 플랫폼.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased min-h-screen bg-background">
        <NavBar />
        <main className="mx-auto max-w-[1440px] px-6 py-8">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
