# v2 진행 상황 (작업 인계용)

브랜치 `v2/ops-desk` — 푸시·배포는 사용자 확인 후에만. 커밋은 Phase 단위.

| Phase | 상태 | 커밋 |
|---|---|---|
| 1 디자인 시스템 | 완료 | `5278649` |
| 2 셸·홈·기존 페이지 이전 | 완료·보고·승인 (2026-10-07) | `5f32bd8` |
| **2.5 실시간 데이터** | **다음 — 키 없이 수집 구조부터 (2026-10-07 결정)** | |
| 3–6 | 대기 | |

## Phase 2 결과 요약
- Lighthouse 홈: 실측 스로틀 성능 99 · LCP 1.69–1.95s · CLS 0 / 시뮬레이션 95 · 3.0s(참고) / 데스크톱 100 · 0.62s. 접근성 전 페이지 100.
- 검증: 스크린샷 216장(11 라우트 × 8 뷰포트 × 2 테마 + 배율·DPR·reduced-motion) 넘침·콘솔 0, axe 60회 위반 0, 테스트 46.
- 폰트: Pretendard core(87KB, preload) + ext(272KB, unicode-range). UI 문구에 새 한글이 생기면
  `font-coverage` 테스트가 실패 → `scripts/subset-fonts.sh` 재실행(python fonttools·brotli 필요).
- 남은 정리 거리: /analytics 성능 91(recharts 지연 로딩), 조선영업 "높음" 등급의 accent 사용,
  vesselExtraction 정규식 줄 넘김(Phase 4 파서 재작성), /about 문구(Phase 6).

## Phase 2.5 계획 (키 없이 진행)
지시서 11장 + 12.1(지도 컴포넌트). 키가 필요한 소스는 화면에 "API 키 미설정"(DataBadge `nokey`)으로 둔다.
1. 소스 어댑터 `src/lib/sources/<name>.ts` — fetch → parse → validate → normalize, 반환 `{ metric, value, unit, asOf, fetchedAt, source, sourceUrl }`.
   키 없이 붙일 수 있는 것부터(예: EIA 공개 페이지 여부·기상청 명세 확인), 나머지는 키 확인 후 `nokey`.
2. 저장소 추상화 — Supabase(권장) 인터페이스 + 키 없을 때 메모리/파일 대체. 직전 대비 ±30% 이상은 저장하지 않고 경고.
3. 스케줄 — Vercel 플랜과 무관하게: 요청 시 갱신(stale-while-revalidate) + 최소 간격, 외부 스케줄러(Supabase pg_cron) 연결점.
4. `/api/ingest/[source]`, `/api/data/[metric]`, `/status` 페이지(소스별 마지막 성공·연속 실패·응답 시간), 헤더 상태 점.
5. `src/lib/portRisk.ts` + 11.4 검증 케이스 테스트, `src/data/kmaPortZones.ts`(구역 매핑은 기상청 명세로 검증 후).
6. MapLibre 지도 컴포넌트(동적 import), 베이스맵 타일 약관 조사.
7. 소스 조사 미결: Dubai 일간·주간 합법 소스, 약관이 허용하는 벙커유 공개 사이트.
8. `.env.example`에 키 이름·발급처.

## 사용자 준비 항목 (발급되는 대로 연결)
기상청 API허브·공공데이터포털(특보·단기·중기예보) 활용 신청, EIA·수출입은행·한국은행 ECOS·aisstream.io 키,
Supabase 계정, Vercel 환경변수. SCFI는 SSE 허락 필요(보류), KCCI는 이용조건 확인.

## 검증 도구
`.reports/qa-tools/`(git 제외, 로컬 보존): `npm i` 후 사용. 사용법은 각 파일 첫 줄 주석.
- `shoot.mjs` 스크린샷·가로 넘침·콘솔, `matrix.sh`/`matrix2.sh` 전 라우트 매트릭스
- `lh.mjs`(시뮬레이션 중앙값), `lh-devtools.mjs`(실측 스로틀·데스크톱 — LCP 판정 기준)
- `axe-all.mjs` 접근성, `small-muted.mjs` 12px 미만 fg-muted, `shell-test.mjs` 셸 상호작용, `record-gif.mjs` 첫 화면 GIF
- 서버: `.claude/launch.json`의 `ocean-dev`(3000), `ocean-prod`(3100, `npm run build` 후)
