import localFont from "next/font/local";
import { JetBrains_Mono } from "next/font/google";

// 한글·UI: Pretendard Variable, 굵기 축 400–700 (scripts/subset-fonts.sh가 두 파일을 만든다)
//   core  라틴 + 사이트 UI 문구에 쓰인 한글 + 쓰는 기호 (약 87KB)
//   ext   나머지 KS X 1001 한글·자모·기호 — unicode-range로 선언해 그런 글자가 화면에 있을 때만 받는다
// core는 preload(첫 화면 글꼴 교체 방지·실측 LCP), ext는 필요할 때만.
// adjustFontFallback: false — 스택 중간에 Arial 대체 글꼴이 끼어 확장 폰트보다 먼저 잡히는 것을 막는다.
export const pretendard = localFont({
  src: "./fonts/PretendardVariable.core.woff2",
  weight: "400 700",
  display: "swap",
  preload: true,
  adjustFontFallback: false,
  variable: "--font-pretendard",
});

export const pretendardExt = localFont({
  src: "./fonts/PretendardVariable.ext.woff2",
  weight: "400 700",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  variable: "--font-pretendard-ext",
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+2010-2027, U+2030-205E, U+20AC, U+2122, U+2190-21FF, U+2200-22FF, U+2460-24FF, U+25A0-25FF, U+3000-303F, U+3131-318E, U+AC00-D7A3, U+FF01-FF5E",
    },
  ],
});

// 숫자·코드
export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  preload: true,
  variable: "--font-jetbrains",
});
