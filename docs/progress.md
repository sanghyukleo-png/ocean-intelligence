# v2 진행 상황 (작업 인계용)

브랜치 `v2/ops-desk` — 푸시·배포는 사용자 확인 후에만. 커밋은 Phase 단위.

| Phase | 상태 | 커밋 |
|---|---|---|
| 1 디자인 시스템 | 완료 | `5278649` |
| 2 셸·홈·기존 페이지 이전 | 완료·보고·승인 (2026-10-07) | `5f32bd8` |
| **2.5 실시간 데이터** | **수집 구조 구현·보고 대기 (2026-10-08)** — 키 발급 후 연결·실값 검증이 남음 | (이번 커밋) |
| 3–6 | 대기 | |

## Phase 2 결과 요약
- Lighthouse 홈: 실측 스로틀 성능 99 · LCP 1.69–1.95s · CLS 0 / 시뮬레이션 95 · 3.0s(참고) / 데스크톱 100 · 0.62s. 접근성 전 페이지 100.
- 검증: 스크린샷 216장(11 라우트 × 8 뷰포트 × 2 테마 + 배율·DPR·reduced-motion) 넘침·콘솔 0, axe 60회 위반 0, 테스트 46.
- 폰트: Pretendard core(87KB, preload) + ext(272KB, unicode-range). UI 문구에 새 한글이 생기면
  `font-coverage` 테스트가 실패 → `scripts/subset-fonts.sh` 재실행(python fonttools·brotli 필요).
- 남은 정리 거리: /analytics 성능 91(recharts 지연 로딩), 조선영업 "높음" 등급의 accent 사용,
  vesselExtraction 정규식 줄 넘김(Phase 4 파서 재작성), /about 문구(Phase 6).

## Phase 2.5 결과 (키 없이, 2026-10-08) — 상세는 docs/data-sources.md 8장
- 수집 구조: `src/lib/sources/*`(어댑터) → `src/lib/ingest/run.ts`(키 확인·최소 간격·±30% 검증·기록) → `src/lib/store`(Supabase | 메모리)
  → `src/lib/data/read.ts`(등급 live/stale/nokey/pending) → 화면. `/api/ingest/[source]`(Bearer CRON_SECRET, `?force=1`, `?simulate=fail`),
  `/api/data/[metric]`, `/api/status`, `/status` 페이지, 헤더 상태 점.
- 스케줄: 헤더 점의 `/api/status` 호출 → after()로 기한 지난 소스 수집(정적 페이지의 after는 빌드·재검증 중 외부 호출이 막혀 쓰지 않음) →
  상태가 바뀌면 /, /market, /ops/weather 재검증. 외부 스케줄러 예시 `supabase/cron.example.sql`, `vercel.json` 일 1회 안전망.
- 키 없이 LIVE: USD/KRW(ECB 기준환율·Frankfurter, 3순위). 나머지는 "API 키 미설정" 또는 "연결 예정"(소스 미확보).
- `src/lib/portRisk.ts` + 11.4 검증 케이스, `src/data/kmaZones.ts`(특보구역코드 원문), `src/data/kmaPortZones.ts`(법령 별표 7 기준 매핑),
  `src/lib/kma/warnings.ts`(통보문 t6·t7 해석, 예보용어 시간범주). `/ops/weather` 국내 탭(표·지도·근거·통보문 원문·면책).
- 지도: `src/components/map/sea-map.tsx`(MapLibre 6.10.0 동적 import, OpenFreeMap, 테마 토큰). 워커는 public/vendor로 복사(predev·prebuild).
- 검증: 테스트 94, lint 0, build OK, Lighthouse 실측 / 99·LCP 1.98s, /ops/weather 99·CLS 0, /market 100, /status 99.
- 남은 일(키 발급 후): 실값 연결·Vercel 서버 호출 테스트, 날씨누리 3개 항 대조, API허브 명세(단기 해상예보·태풍), 묘박지·특보구역 폴리곤,
  Dubai·벙커·SCFI 결정(8.2).

## 사용자 준비 항목 (발급되는 대로 연결)
기상청 API허브·공공데이터포털(특보·단기·중기예보) 활용 신청, EIA·수출입은행·한국은행 ECOS·aisstream.io 키,
Supabase 계정, Vercel 환경변수. SCFI는 SSE 허락 필요(보류), KCCI는 이용조건 확인.

## 검증 도구
`.reports/qa-tools/`(git 제외, 로컬 보존): `npm i` 후 사용. 사용법은 각 파일 첫 줄 주석.
- `shoot.mjs` 스크린샷·가로 넘침·콘솔, `matrix.sh`/`matrix2.sh` 전 라우트 매트릭스
- `lh.mjs`(시뮬레이션 중앙값), `lh-devtools.mjs`(실측 스로틀·데스크톱 — LCP 판정 기준)
- `axe-all.mjs` 접근성, `small-muted.mjs` 12px 미만 fg-muted, `shell-test.mjs` 셸 상호작용, `record-gif.mjs` 첫 화면 GIF
- `map-check.mjs` 지도 렌더 확인(개발 서버 — `window.__oiMapDebug`로 타일 로드 대기)
- 서버: `.claude/launch.json`의 `ocean-dev`(3000), `ocean-prod`(3100), `ocean-prod-ingest`(3101, CRON_SECRET=local-test-secret — 수집·실패 시험)
- 브라우저 패널이 숨겨져 있으면 requestAnimationFrame이 멈춰 MapLibre 스타일이 로드되지 않는다 → 지도 확인은 headless 스크립트로
