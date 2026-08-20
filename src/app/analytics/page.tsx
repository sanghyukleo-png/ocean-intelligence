import { TceCalculator } from "@/components/tce-calculator";

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      <section>
        <p className="text-xs font-medium tracking-[0.16em] text-accent">VOYAGE ECONOMICS</p>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">Analytics</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          A deterministic Time Charter Equivalent (TCE) calculator. All figures are computed with
          pure TypeScript math — never delegated to an LLM. Adjust the sensitivity sliders to see
          real-time impact on voyage economics.
        </p>
      </section>

      <TceCalculator />
    </div>
  );
}
