import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StyleguideClient } from "./styleguide-client";

export const metadata: Metadata = {
  title: "Styleguide",
  robots: { index: false, follow: false },
};

// 개발 전용 — 프로덕션 빌드에서는 404
export default function StyleguidePage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <StyleguideClient />;
}
