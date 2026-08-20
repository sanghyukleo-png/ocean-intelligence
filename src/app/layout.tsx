import type { Metadata } from "next";
import "./globals.css";
import { NavBar } from "@/components/nav-bar";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "OCEAN INTELLIGENCE — AI-powered Maritime Market & Sales Intelligence",
  description:
    "A maritime commercial intelligence platform demonstrating data-driven market intelligence, vessel analysis, and sales opportunity scoring for merchant shipbuilding sales planning.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-background">
        <NavBar />
        <main className="mx-auto max-w-[1440px] px-6 py-8">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
