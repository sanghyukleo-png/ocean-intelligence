# OCEAN INTELLIGENCE

정유·석유화학 **해상 오퍼레이션 데스크** — 용선·선적·수출 실무자가 매일 보는 시장 값과 항만 기상을 공식·공개 소스에서 모으고,
항차 계산을 같은 화면에서 끝내도록 만든 웹 앱입니다. 화면 문구는 한국어입니다.

**원칙**: 가상·예시 데이터를 쓰지 않습니다. 모든 수치에 등급(LIVE · 입력값 계산 · 직접 입력)과 출처·원천 기준 시각·수집 시각을 붙이고,
API 키가 없거나 수집에 실패한 값은 지어내지 않고 상태를 그대로 보여 줍니다(`/status`).

## 화면

| 경로 | 내용 | 데이터 |
|---|---|---|
| `/` | 라이브 티커, 해협 바다 상태, 오늘의 국내항, 해외 항만 바다 상태, 해운 뉴스 | 수집값 |
| `/market` | 원유(Brent·WTI·Dubai 월평균), 미국 석유제품 현물·크랙 스프레드, 수출국 환율, SCFI·KCCI, 해협 기상, 벙커가 직접 입력 | 수집값 · 직접 입력 |
| `/ops/weather` | 국내 12개 항 클로징 위험도(기상청 특보 규칙 — 키 필요), 국내·해외 항만 72시간 바람·파고·시정 | 수집값 |
| `/vessels` · `/compare` | Q88·제원 텍스트 추출, 내 선박 저장·비교(이 브라우저에만 저장) | 입력값 |
| `/analytics` | 항차 손익·TCE 계산 | 입력값 계산 |
| `/status` | 소스별 마지막 성공·연속 실패·응답 시간·API 키 설정 여부 | — |
| `/ops/*` | Laytime·운임·넷백·수량 환산·딜 타임라인·항로 맵 — 준비 중 | — |

## 데이터 소스 (상세·약관 검토: `docs/data-sources.md`)

키 없이 동작: EIA 현물가 공개 표(원유·석유제품), ECB 기준환율(Frankfurter), IMF 1차 상품가격(Dubai 월평균),
상하이해운거래소 SCFI 종합지수, 한국해양진흥공사 KCCI, Open-Meteo(항만·해협 72시간 예보).
키가 있으면 추가: EIA API, 한국수출입은행·한국은행 ECOS(USD/KRW), 기상청 특보·중기해상예보(공공데이터포털), aisstream.io(AIS).
수집하지 않음: Platts·Argus·Baltic·Worldscale 등 유료 평가, 벙커유(약관이 허용하는 무료 소스 없음 → 직접 입력).

## 구조

```
외부 스케줄러(/api/ingest/[source], CRON_SECRET) · 요청 시 갱신(/api/status → after)
  → src/lib/sources/*   어댑터: fetch → parse → validate → normalize
  → src/lib/ingest      키 확인 · 최소 간격 · ±30% 급변 검증 · 수집 기록
  → src/lib/store       Supabase(PostgREST) | 서버 메모리(키 없을 때 임시)
  → src/lib/data/read   등급(LIVE · 수집 실패 · API 키 미설정 · 연결 예정) → 화면
```

계산은 `src/lib`의 순수 함수(`tce.ts`, `portRisk.ts`, `weather/metSummary.ts` …)가 하고 vitest로 검증합니다.

## 개발

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # vitest
npm run build
```

환경변수는 `.env.example`, Supabase 스키마는 `supabase/migrations/0001_ingest.sql`, 외부 스케줄 예시는 `supabase/cron.example.sql`.

## 스택

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · MapLibre GL(OpenFreeMap) · Recharts · Vitest.
