import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const badgeVariants = cva(
  "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-[3px] text-[0.6875rem] font-semibold leading-none tracking-[0.04em]",
  {
    variants: {
      tone: {
        neutral: "border-line-strong bg-subtle text-fg-muted",
        accent: "border-accent/35 bg-accent/10 text-accent",
        up: "border-up/35 bg-up/10 text-up",
        down: "border-down/35 bg-down/10 text-down",
        warn: "border-warn/35 bg-warn/10 text-warn",
        info: "border-info/35 bg-info/10 text-info",
      },
    },
    defaultVariants: { tone: "neutral" },
  }
);

export function Badge({
  tone,
  className,
  dot = false,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants> & { dot?: boolean }) {
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...props}>
      {dot && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

// ── 데이터 등급 배지: 화면의 모든 수치에 붙인다 ───────────────────────
// live   외부 소스 실값 (출처·원천 기준 시각·수집 시각·발표 주기)
// stale  수집 실패 → 마지막 성공값을 표시 중 (실패 사유·마지막 성공 시각)
// nokey  API 키 미설정 → 값 없음 (숨기지 않고 표시)
// calc   사용자 입력값으로 계산
// demo   시뮬레이션 — 핵심 지표에는 쓰지 않는다 (지시서 11장)
export type DataGrade = "live" | "stale" | "nokey" | "calc" | "demo";

export interface DataProvenance {
  /** 출처 이름 (예: "EIA", "기상청 API허브") */
  source?: string;
  sourceUrl?: string;
  /** 원천 기준 시각 — 원천이 값을 발표·기준한 시각 */
  asOf?: string | Date;
  /** 우리 서버가 수집한 시각 */
  fetchedAt?: string | Date;
  /** 발표 주기 (예: "주 1회 · 금", "장중 연속", "일 1회") */
  cadence?: string;
  /** 지연 시세 표기 (예: "15분 지연") */
  delay?: string;
  /** stale: 실패 사유 */
  error?: string;
}

const KST = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Seoul",
});

function toDate(at: string | Date | undefined) {
  if (!at) return null;
  const d = typeof at === "string" ? new Date(at) : at;
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "2026. 10. 06. 14:32" → "10.06 14:32" */
export function formatKst(at: string | Date | undefined, withDate = true) {
  const d = toDate(at);
  if (!d) return "";
  const parts = Object.fromEntries(KST.formatToParts(d).map((p) => [p.type, p.value]));
  const time = `${parts.hour}:${parts.minute}`;
  return withDate ? `${parts.month}.${parts.day} ${time}` : time;
}

function isToday(at: string | Date | undefined) {
  const d = toDate(at);
  if (!d) return false;
  const today = formatKst(new Date()).slice(0, 5);
  return formatKst(d).slice(0, 5) === today;
}

/** 배지 옆·툴팁에 쓰는 출처 설명 줄들 */
export function provenanceLines(grade: DataGrade, p: DataProvenance = {}) {
  const lines: string[] = [];
  if (p.source) lines.push(`출처 ${p.source}`);
  if (p.asOf) lines.push(`원천 기준 ${formatKst(p.asOf)} KST`);
  if (p.fetchedAt) lines.push(`${grade === "stale" ? "마지막 성공 수집" : "수집"} ${formatKst(p.fetchedAt)} KST`);
  if (p.cadence) lines.push(`발표 주기 ${p.cadence}`);
  if (p.delay) lines.push(p.delay);
  if (grade === "stale" && p.error) lines.push(`실패 사유 ${p.error}`);
  return lines;
}

export function DataBadge({
  grade,
  className,
  ...provenance
}: { grade: DataGrade; className?: string } & DataProvenance) {
  const lines = provenanceLines(grade, provenance);
  const title = lines.join("\n") || undefined;
  const srText = lines.length ? <span className="sr-only">{` (${lines.join(", ")})`}</span> : null;

  if (grade === "live") {
    // 배지에는 원천 기준 시각을 짧게(오늘이면 시:분, 아니면 월.일)
    const stamp = provenance.asOf
      ? isToday(provenance.asOf)
        ? formatKst(provenance.asOf, false)
        : formatKst(provenance.asOf).slice(0, 5)
      : "";
    return (
      <Badge tone="up" dot className={className} title={title}>
        LIVE
        {stamp && <span className="num font-medium opacity-80">{stamp}</span>}
        {provenance.delay && <span className="font-medium opacity-80">· {provenance.delay}</span>}
        {srText}
      </Badge>
    );
  }
  if (grade === "stale") {
    return (
      <Badge tone="warn" dot className={className} title={title}>
        수집 실패
        {provenance.fetchedAt && (
          <span className="num font-medium opacity-80">{formatKst(provenance.fetchedAt).slice(0, 11)} 값</span>
        )}
        {srText}
      </Badge>
    );
  }
  if (grade === "nokey") {
    return (
      <Badge tone="neutral" className={cn("border-dashed", className)} title={title ?? "환경변수에 API 키가 없어 수집하지 않음"}>
        API 키 미설정
        {srText}
      </Badge>
    );
  }
  if (grade === "calc") {
    return (
      <Badge tone="info" className={className} title="사용자 입력값으로 계산한 결과">
        입력값 계산
      </Badge>
    );
  }
  return (
    <Badge tone="neutral" className={className} title="시뮬레이션 데이터 — 실제 시장 값이 아님">
      DEMO
    </Badge>
  );
}

/** 지표 하단의 출처 한 줄: "EIA · 원천 10.03 · 수집 10.06 14:32 · 일 1회" */
export function ProvenanceLine({ grade, className, ...p }: { grade: DataGrade; className?: string } & DataProvenance) {
  const parts = [
    p.source,
    p.asOf && `원천 ${formatKst(p.asOf)}`,
    p.fetchedAt && `${grade === "stale" ? "마지막 성공" : "수집"} ${formatKst(p.fetchedAt)}`,
    p.cadence,
    grade === "stale" && p.error ? `실패: ${p.error}` : null,
  ].filter(Boolean);
  if (!parts.length) return null;
  return (
    <p className={cn("text-xs leading-relaxed text-fg-muted", className)}>
      {p.sourceUrl && p.source ? (
        <>
          <a href={p.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline decoration-line-strong underline-offset-2 hover:text-fg">
            {p.source}
          </a>
          {parts.length > 1 && " · "}
          {parts.slice(1).join(" · ")}
        </>
      ) : (
        parts.join(" · ")
      )}
    </p>
  );
}
