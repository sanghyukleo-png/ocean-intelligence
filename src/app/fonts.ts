import localFont from "next/font/local";
import { JetBrains_Mono } from "next/font/google";

// 한글·UI: Pretendard Variable — KS X 1001 한글 2,350자 + 라틴 서브셋 (scripts/subset-fonts.sh)
export const pretendard = localFont({
  src: "./fonts/PretendardVariable.subset.woff2",
  weight: "45 920",
  display: "swap",
  variable: "--font-pretendard",
  fallback: ["-apple-system", "BlinkMacSystemFont", "Apple SD Gothic Neo", "Malgun Gothic", "sans-serif"],
});

// 숫자·코드
export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains",
});
