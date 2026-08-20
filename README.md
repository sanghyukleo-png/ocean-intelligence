# OCEAN INTELLIGENCE

AI-powered Maritime Market & Sales Intelligence — a portfolio project demonstrating
market-intelligence and sales-planning workflows for merchant shipbuilding sales.

**Workflow:** Market Signal → Vessel Intelligence → Commercial Assessment → Sales Opportunity →
Recommended Action → Sales Brief.

## Status: MVP (Tier 1 complete)

| Module | Status |
|---|---|
| Home — Maritime Command Dashboard | ✅ |
| Market — Macro Intelligence | ✅ |
| Opportunities — Sales Opportunity Radar (deterministic scoring engine) | ✅ |
| Generate Sales Brief | ✅ |
| Analytics — Voyage Economics / TCE calculator | ✅ |
| Compare — side-by-side vessel analysis | 🚧 stub |
| Vessels — AI PDF/Q88 extractor | 🚧 stub |

All data is simulated/demo data. Nothing in this app represents live market information or real
companies.

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
