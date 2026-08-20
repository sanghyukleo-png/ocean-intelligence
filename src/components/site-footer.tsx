import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border py-8">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-2 px-6 text-center text-xs text-muted">
        <p>
          PERSONAL AI PRODUCT PROJECT — Petrochemical Market Intelligence
          <span className="mx-1.5 text-border">→</span>Global B2B Sales
          <span className="mx-1.5 text-border">→</span>Commercial Analysis
          <span className="mx-1.5 text-border">→</span>Maritime Intelligence
        </p>
        <p>
          All market, vessel, and customer data shown is simulated for demonstration purposes.{" "}
          <Link href="/about" className="text-accent hover:underline">
            About this project
          </Link>
        </p>
      </div>
    </footer>
  );
}
