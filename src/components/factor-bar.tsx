export function FactorBar({
  label,
  value,
  weightPct,
}: {
  label: string;
  value: number;
  weightPct: number;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted">
          {label} <span className="text-border">· 가중치 {weightPct}%</span>
        </span>
        <span className="font-mono-num text-foreground">{value}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-accent"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}
