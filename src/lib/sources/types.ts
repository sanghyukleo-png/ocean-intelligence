// 수집 파이프라인 공통 타입 (지시서 11.2)
// Vercel/외부 스케줄러 → /api/ingest/[source] → 어댑터(fetch → parse → validate → normalize) → 저장소 → /api/data/[metric] → 화면

/** 수치 관측값 — 어댑터의 정규화 결과 */
export interface Observation {
  metric: string;
  value: number;
  unit: string;
  /** 원천 기준 시각(ISO). 날짜만 주면 "YYYY-MM-DD"(day), 월 값이면 "YYYY-MM"(month) 그대로 둔다 */
  asOf: string;
  asOfPrecision: "month" | "day" | "minute";
  /** 우리 서버 수집 시각(ISO) */
  fetchedAt: string;
  source: string;
  sourceUrl: string;
}

/** 수치가 아닌 문서형 수집 결과(특보 현황, 중기해상예보, AIS 집계 등) */
export interface Snapshot<T = unknown> {
  key: string;
  data: T;
  asOf: string;
  fetchedAt: string;
  source: string;
  sourceUrl: string;
}

export type FailureKind =
  | "http" // 원천이 오류 상태 코드
  | "timeout"
  | "network"
  | "auth" // 키 거부·한도 초과 등 원천이 알려준 인증 문제
  | "parse" // 응답 형식이 명세와 다름
  | "empty" // 형식은 맞지만 값이 없음(비영업일 등)
  | "invalid"; // 값 검증 실패(범위 밖·직전 대비 급변)

export class SourceError extends Error {
  constructor(
    public kind: FailureKind,
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = "SourceError";
  }
}

export const FAILURE_LABEL: Record<FailureKind, string> = {
  http: "원천 서버 오류",
  timeout: "시간 초과",
  network: "네트워크 오류",
  auth: "인증·한도 오류",
  parse: "응답 형식 오류",
  empty: "빈 응답",
  invalid: "값 검증 실패",
};

export interface CollectContext {
  env: Record<string, string | undefined>;
  now: Date;
  fetch: typeof fetch;
  /** 직전 스냅샷 등 어댑터가 이어서 써야 하는 상태 */
  getSnapshot: <T>(key: string) => Promise<Snapshot<T> | null>;
}

export interface CollectResult {
  observations?: Observation[];
  snapshots?: Snapshot[];
  /** 저장은 했지만 화면에 알릴 경고(예: 일부 항목 누락) */
  warnings?: string[];
}

/**
 * 수집 가능 상태
 * ready      키만 있으면 수집
 * needs-spec 키 발급 후 명세 문서를 받아 확인해야 구현 가능(필드명 추측 금지)
 * blocked    약관을 지키는 무료 소스를 찾지 못함 — 보고서에 사유·대안
 */
export type Availability = "ready" | "needs-spec" | "blocked";

export interface SourceDef {
  id: string;
  name: string;
  /** 화면 출처 표기(짧게) */
  label: string;
  /** false면 요청 시 갱신(after)에서 제외 — 수집이 오래 걸리는 소스(AIS)는 외부 스케줄러로만 */
  onRequest?: boolean;
  /** 사람이 보는 원천 페이지 */
  sourceUrl: string;
  /** 이 소스가 채우는 지표·스냅샷 키 */
  provides: string[];
  /** 필요한 환경변수(값은 절대 화면·로그에 쓰지 않는다) */
  envKeys: string[];
  /** 발급처 안내 */
  keyHelp?: string;
  availability: Availability;
  /** blocked·needs-spec 사유 */
  note?: string;
  /** 원천 발표 주기(화면 표기) */
  cadence: string;
  /** 성공 후 다음 수집까지 최소 간격(초) */
  minIntervalSec: number;
  /** 직전 대비 허용 변동(비율). 기본 0.3(지시서 11.2 예시값) */
  maxJump?: number;
  /** 실패 후 재시도 최소 간격(초) */
  retryIntervalSec: number;
  /** 마지막 성공이 이 시간보다 오래되면 "지연" */
  staleAfterSec: number;
  /** 약관·출처 표기 메모(상태 페이지) */
  terms: string;
  collect?: (ctx: CollectContext) => Promise<CollectResult>;
}

export interface RunRecord {
  sourceId: string;
  startedAt: string;
  finishedAt: string;
  ok: boolean;
  durationMs: number;
  kind?: FailureKind;
  message?: string;
  accepted: number;
  rejected: number;
}

export interface SourceStatus {
  sourceId: string;
  lastAttemptAt: string | null;
  lastSuccessAt: string | null;
  consecutiveFailures: number;
  lastDurationMs: number | null;
  lastError: { kind: FailureKind; message: string; at: string } | null;
}
