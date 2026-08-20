import { Card } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <section>
        <p className="text-xs font-medium tracking-[0.16em] text-accent">ABOUT THIS PROJECT</p>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">
          Why a petrochemical trader built a maritime intelligence product
        </h1>
      </section>

      <Card className="space-y-4 text-sm leading-relaxed text-foreground">
        <p>
          I spent four and a half years on the SM/BTX sales desk at a global petrochemical
          producer, covering domestic tank-lorry sales and export bulk-vessel contracts (COA and
          spot) for roughly 600KTA of styrene monomer and MMA capacity. Day to day, that meant
          reading ICIS/Platts price signals, structuring arbitrage between regional markets,
          nominating vessels and coordinating terminal logistics, and managing L/C-based credit
          risk with overseas buyers — including navigating a benzene-shortage spike triggered by a
          regional supply shock.
        </p>
        <p>
          That work is, at its core, market intelligence feeding commercial decisions: which
          customer to prioritize, when to commit tonnage, how to price a cargo under shifting
          freight and feedstock conditions. OCEAN INTELLIGENCE is my attempt to show that the same
          discipline applies directly to merchant shipbuilding sales planning — reading fleet-age
          and orderbook signals the way I once read benzene-styrene spreads, and turning them into
          a ranked, explainable sales pipeline instead of a spreadsheet.
        </p>
        <p>
          Every number in this product is either a deterministic calculation (the opportunity
          score, the TCE calculator) or clearly labeled demo data — nothing here claims to be live
          market information. The AI layer only explains and drafts; it never decides. That
          separation was a deliberate choice, mirroring how I&apos;d want a real sales-planning tool to
          behave.
        </p>
        <p className="text-muted">
          Built with Next.js, TypeScript, and Tailwind CSS as a self-directed project while
          transitioning from petrochemical trading toward maritime commercial roles. This
          product&apos;s data pipeline is architected to connect to a real backend (Supabase)
          without a UI rewrite when the demo data is ready to be replaced.
        </p>
      </Card>
    </div>
  );
}
