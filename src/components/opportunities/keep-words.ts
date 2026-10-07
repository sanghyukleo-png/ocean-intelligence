// WORD JOINER(U+2060): 보이지 않고, 그 자리의 줄바꿈만 막는다. 화면 낭독기는 읽지 않는다.
const WJ = "\u2060";
// NO-BREAK SPACE: 공백으로 보이지만 그 자리에서 줄을 바꾸지 않는다.
const NBSP = "\u00a0";

/**
 * 표시용 문자열에서 한 어절 안의 줄바꿈을 막는다.
 * word-break: keep-all은 한글 음절 사이만 붙잡고, 괄호 경계("100점 | (매우", "높음) | 으로",
 * "Carriers은 | (는)")와 범위 대시("0– | 100")에서는 여전히 줄을 바꾼다. 그 경계에 WORD JOINER를 넣어
 * 줄바꿈이 공백에서만 일어나게 한다.
 * 표시 전용 — 클립보드로 복사하는 원문에는 쓰지 않는다.
 */
export function keepKoreanWords(text: string) {
  return text
    .replace(/([)\]])(?=[0-9A-Za-z가-힣])/g, `$1${WJ}`) // 닫는 괄호 + 조사·글자: "높음)으로"
    .replace(/([^\s([])(?=[([])/g, `$1${WJ}`) // 글자 + 여는 괄호: "100점(매우", "Carriers(그리스)"
    .replace(/([0-9])–(?=[0-9])/g, `$1–${WJ}`) // 범위 대시: "0–100"
    .replace(/\(([^()\s]+) ([^()\s]+)\)/g, (m, a: string, b: string) =>
      a.length + b.length <= 8 ? `(${a}${NBSP}${b})` : m
    ); // 짧은 두 단어 괄호는 한 덩어리로: "(매우 | 높음)으로" 방지
}
