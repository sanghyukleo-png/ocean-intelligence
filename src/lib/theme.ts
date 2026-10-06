export type Theme = "dark" | "light";

export const THEME_STORAGE_KEY = "oi-theme";

// <head>에서 첫 페인트 전에 실행되어 테마 깜빡임을 막는다.
// 우선순위: 사용자가 고른 값(localStorage) → 시스템 설정 → dark
export const THEME_INIT_SCRIPT = `(function(){try{var k='${THEME_STORAGE_KEY}',t=localStorage.getItem(k);if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}document.documentElement.setAttribute('data-theme',t)}catch(e){document.documentElement.setAttribute('data-theme','dark')}})()`;
