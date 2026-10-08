import type { Metadata } from "next";
import CompareClient from "./compare-client";

// 화면 상호작용은 클라이언트 컴포넌트에, 메타데이터는 서버 page에 둔다(generateMetadata 문서 권장 구조).
export const metadata: Metadata = {
  title: "선박 비교",
  description: "Q88 분석에서 저장한 내 선박 2~4척의 주요 제원을 나란히 비교합니다.",
};

export default function ComparePage() {
  return <CompareClient />;
}
