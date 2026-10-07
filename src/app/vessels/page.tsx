import type { Metadata } from "next";
import VesselsClient from "./vessels-client";

// 화면 상호작용은 클라이언트 컴포넌트에, 메타데이터는 서버 page에 둔다(generateMetadata 문서 권장 구조).
export const metadata: Metadata = {
  title: "Q88 분석",
  description: "선박 제원 텍스트를 붙여넣으면 선명·IMO·DWT 등 핵심 필드를 추출하고 원문 줄과 신뢰도를 함께 보여줍니다.",
};

export default function VesselsPage() {
  return <VesselsClient />;
}
