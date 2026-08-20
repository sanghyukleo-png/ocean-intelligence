# OCEAN INTELLIGENCE

AI-powered Maritime Market & Sales Intelligence — a Korean-language portfolio project
demonstrating market-intelligence and sales-planning workflows for merchant shipbuilding sales,
built for a Hanwha Ocean 영업기획(Sales Planning) job application.

**Workflow:** Market Signal → Vessel Intelligence → Commercial Assessment → Sales Opportunity →
Recommended Action → Sales Brief.

## Status: full build complete

| Module | Status |
|---|---|
| Home — 종합 커맨드 대시보드 | ✅ |
| Market — 매크로 인텔리전스 | ✅ |
| Vessels — 정규식 기반 Q88/제원표 추출 엔진 | ✅ |
| Compare — 선박 2~4척 비교 분석 | ✅ |
| Opportunities — 영업기회 레이더 (결정론적 스코어링 엔진) | ✅ |
| 영업 브리프 생성 | ✅ |
| Analytics — 항해 경제성 / TCE 계산기 | ✅ |

All data is simulated/demo data. Nothing in this app represents live market information or real
companies. UI copy is in Korean; every page opens with a "이 화면이 보여주는 것 / 핵심 작동
방법" banner explaining what it shows and how it works, so each module can be tried live.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Recharts · Lucide icons.
No external UI framework dependency (shadcn/ui init was skipped due to sandbox network
restrictions; equivalent primitives are hand-built in `src/components/ui`).

## Architecture

- `src/types` — shared TypeScript interfaces (Vessel, Opportunity, MarketIndicator, SalesBrief …)
- `src/data` — typed mock data, isolated from UI components
- `src/lib/scoring.ts` — deterministic Opportunity Scoring Engine (rules calculate; AI only
  explains)
- `src/lib/tce.ts` — deterministic Voyage Economics / TCE calculator (pure math, no LLM)
- `src/lib/salesBrief.ts` — deterministic Sales Brief generator (demo/fallback path for the
  `AIProvider.generateSalesBrief` contract)

## Local development

```bash
npm install
npm run dev
```

## Deployment

```bash
npx vercel        # first deploy / link project
npx vercel --prod # production deploy
```

See `.env.example` for the environment variables needed once Supabase / an LLM provider are wired
in. The app runs end-to-end without any of them (demo mode).
