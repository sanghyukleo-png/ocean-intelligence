import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { PageShell } from "@/components/shell/page-shell";
import { Badge, DataBadge, formatKst } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SimpleTable } from "@/components/ui/simple-table";
import { PortRiskMap } from "@/components/weather/port-map";
import { KMA_PORTS, MID_SEA_REGIONS } from "@/data/kmaPortZones";
import { zoneName } from "@/data/kmaZones";
import { readMet, readPortRisks } from "@/lib/data/read";
import { Tabs } from "@/components/ui/tabs";
import { MiniSeries } from "@/components/weather/mini-series";
import { OVERSEAS_PORTS } from "@/data/overseasPorts";
import type { MetPoint } from "@/lib/sources/openMeteo";
import { DEFAULT_MET_THRESHOLDS, compass, summarizeMet } from "@/lib/weather/metSummary";
import { formatNum } from "@/lib/utils";
import { DEFAULT_THRESHOLDS, KMA_CRITERIA } from "@/lib/portRisk";
import { getStore } from "@/lib/store";
import { RISK_LEVELS, type RiskLevel } from "@/lib/tokens";

export const metadata: Metadata = {
  title: "항만 기상 · 클로징 위험도",
  description: "기상청 특보·예비특보·중기해상예보로 산출한 국내 12개 주요항의 입출항 클로징 위험 등급과 근거",
};

export const revalidate = 300;

const DISCLAIMER =
  "본 위험도는 기상청 특보·예보에 근거한 추정이며 공식 입출항 통제가 아닙니다. 실제 통제는 관할 VTS·지방해양수산청·터미널 공지를 확인하십시오.";

function Level({ level }: { level: RiskLevel | null }) {
  if (level === null) return <span className="text-fg-faint">—</span>;
  const r = RISK_LEVELS[level];
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full" style={{ background: `var(${r.token})` }} />
      {r.label}
    </span>
  );
}

/** 국내 항 표의 Open-Meteo 참고 칸: 풍속 곡선 + 최대 풍속·파고 */
function MetCell({ point }: { point: MetPoint | null }) {
  if (!point) return <span className="text-xs text-fg-faint">—</span>;
  const s = summarizeMet(point);
  return (
    <span className="block">
      <MiniSeries values={point.windKt} threshold={DEFAULT_MET_THRESHOLDS.windKt} label="풍속" unit="kt" />
      <span className="num mt-1 block whitespace-nowrap text-xs text-fg-muted">
        최대 {formatNum(s.maxWindKt, { decimals: 0 })}kt · {formatNum(s.maxWaveM, { decimals: 1 })}m
      </span>
    </span>
  );
}

const ASSUMPTIONS = (
  <>
    <p>
      <strong>등급 규칙(결정론적)</strong> — 통제 중 가능성 높음: 풍랑경보·태풍경보·태풍주의보 발효. 높음: 풍랑주의보 발효 또는{" "}
      {DEFAULT_THRESHOLDS.preliminaryHighH}시간 안에 풍랑·태풍 예비특보. 주의: {DEFAULT_THRESHOLDS.preliminaryCautionH}시간 안의 예비특보, 단기
      해상예보 풍속 {DEFAULT_THRESHOLDS.windKt}kt·파고 {DEFAULT_THRESHOLDS.waveM}m 이상, 안개. 관찰: 중기해상예보 최고 파고{" "}
      {DEFAULT_THRESHOLDS.midWaveM}m 이상 또는 태풍 예상 진로 인근.
    </p>
    <p>
      <strong>특보 발표 기준(기상청)</strong> — 풍랑주의보: 해상 풍속 {KMA_CRITERIA.advisory.windMs}m/s 이상 3시간 지속 또는 유의파고{" "}
      {KMA_CRITERIA.advisory.waveM}m 이상 예상. 풍랑경보: {KMA_CRITERIA.warning.windMs}m/s · {KMA_CRITERIA.warning.waveM}m.
    </p>
    <p>
      <strong>구역 매핑</strong> — 항만은 「해양기상국지예보의 대상구역」(관할 시·군 기준)으로 앞바다 구역에 대응시키고, 같은 앞바다의
      연안·평수구역과 상위 구역(○○앞바다·○○전해상)에 내린 특보를 함께 봅니다. 먼바다 특보는 등급에 넣지 않습니다.
    </p>
    <p>
      <strong>예비특보 시각</strong> — &ldquo;아침·밤&rdquo; 같은 표현은 기상청 예보용어 시간범주의 가장 이른 시작으로 계산합니다(예: 밤 →
      18시).
    </p>
    <p>
      <strong>해제 시점</strong> — 발효 중 특보는 해제 예고가 통보문 원문에만 있어 72시간 전망까지 유지해 보수적으로 표시합니다.
    </p>
  </>
);

export default async function WeatherPage() {
  const store = getStore();
  const [board, met] = await Promise.all([readPortRisks(store), readMet(store)]);
  const metOf = (id: string, kind: MetPoint["kind"]) => (met.state === "ok" ? (met.data.points.find((p) => p.id === id && p.kind === kind) ?? null) : null);
  const T = DEFAULT_MET_THRESHOLDS;
  const w = board.warnings;

  const ports = [...board.ports].sort((a, b) => Number(b.refinery) - Number(a.refinery) || (b.level ?? -1) - (a.level ?? -1));

  const statusBadge =
    w.state === "ok" ? (
      <DataBadge grade="live" source="기상청" sourceUrl="https://www.weather.go.kr/w/special-report/overall.do" asOf={w.asOf} fetchedAt={w.fetchedAt} cadence="특보 수시 발표" />
    ) : w.state === "failed" ? (
      <DataBadge grade="stale" source="기상청" fetchedAt={w.lastSuccessAt ?? undefined} error={w.error} />
    ) : w.state === "nokey" ? (
      <DataBadge grade="nokey" source="기상청" error="KMA_DATA_GO_KR_KEY 미설정" />
    ) : (
      <DataBadge grade="pending" source="기상청" />
    );

  const statusText =
    w.state === "ok"
      ? `특보 현황 ${formatKst(w.asOf)} 기준 · 수집 ${formatKst(w.fetchedAt)}`
      : w.state === "failed"
        ? `특보 수집 실패 — 등급을 표시하지 않습니다${w.lastSuccessAt ? ` · 마지막 성공 ${formatKst(w.lastSuccessAt)}` : ""}`
        : w.state === "nokey"
          ? "기상청 API 키(공공데이터포털)가 설정되지 않아 등급을 산출하지 않습니다. 미수집을 “정상”으로 표시하지 않습니다."
          : "특보 소스 연결 전";

  const points = ports.map((p) => {
    const def = KMA_PORTS.find((d) => d.id === p.portId)!;
    return {
      id: p.portId,
      lon: def.coord[0],
      lat: def.coord[1],
      label: p.name,
      colorToken: p.level === null ? "--fg-faint" : RISK_LEVELS[p.level].token,
      hollow: p.level === null,
    };
  });

  const raw = board.warningsSnapshot?.data.raw;

  const domestic = (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        {statusBadge}
        <p className="text-[0.8125rem] text-fg-muted">{statusText}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <PortRiskMap points={points} className="h-[22rem] lg:sticky lg:top-24 lg:h-[34rem]" />
          <ul role="list" aria-label="등급 범례" className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-fg-muted">
            {RISK_LEVELS.map((r) => (
              <li key={r.level} className="inline-flex items-center gap-1.5">
                <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: `var(${r.token})` }} />
                {r.label}
              </li>
            ))}
            <li className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className="h-2 w-2 rounded-full border border-fg-faint" />
              미산출
            </li>
          </ul>
          <p className="mt-2 text-xs leading-relaxed text-fg-muted">
            항만 위치는 UN/LOCODE 대표 좌표(분 단위)입니다. 해상 특보구역 경계 데이터는 아직 넣지 않았습니다.
          </p>
        </div>

        <div className="min-w-0 space-y-4 lg:col-span-7">
          <SimpleTable
            caption="국내 주요항 클로징 위험도"
            headers={["항만", "현재", "바람·파고 72h(참고)", "근거", "24h", "48h", "72h", "3~10일", "관할 기관"]}
            rows={ports.map((p) => {
              const def = KMA_PORTS.find((d) => d.id === p.portId)!;
              return {
                key: p.portId,
                cells: [
                  <span key="n" className="block">
                    <span className="block whitespace-nowrap font-medium text-fg">{p.name}</span>
                    <span className="mt-1 block whitespace-nowrap text-xs text-fg-muted">{zoneName(def.zones[0])}</span>
                    {p.refinery && <Badge tone="accent" className="mt-2">정유·석화</Badge>}
                  </span>,
                  <Level key="l" level={p.level} />,
                  <MetCell key="om" point={metOf(p.portId, "kr")} />,
                  <span key="r" className="block min-w-56 text-xs leading-relaxed text-fg-muted">
                    {p.failure?.kind === "nokey"
                      ? "API 키 미설정"
                      : p.failure?.kind === "failed"
                        ? `수집 실패 · ${p.failure.lastSuccessAt ? `마지막 성공 ${formatKst(p.failure.lastSuccessAt)}` : "성공 기록 없음"}`
                        : p.reasons.length
                          ? p.reasons.map((r, i) => (
                              <span key={i} className="block">
                                <span className="text-fg">{r.text}</span>
                                {r.validFrom && <> · {r.source === "예비특보" ? "예상" : "발효"} {formatKst(r.validFrom)}</>}
                                {r.announcedAt && <> · 발표 {formatKst(r.announcedAt)}</>}
                              </span>
                            ))
                          : "해당 구역 특보·예비특보 없음"}
                  </span>,
                  <Level key="h1" level={p.horizon[0]} />,
                  <Level key="h2" level={p.horizon[1]} />,
                  <Level key="h3" level={p.horizon[2]} />,
                  <span key="m" className="block whitespace-nowrap">
                    <Level level={p.mid} />
                    <span className="mt-1 block text-xs text-fg-muted">{MID_SEA_REGIONS[def.midSeaRegId]}</span>
                  </span>,
                  def.authority ? (
                    <a key="a" href={def.authority.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 whitespace-nowrap text-xs text-fg-muted underline decoration-line-strong underline-offset-2 hover:text-fg">
                      {def.authority.name}
                      <ExternalLink size={12} aria-hidden="true" />
                      <span className="sr-only">(새 창)</span>
                    </a>
                  ) : (
                    <span key="a" className="text-xs text-fg-muted">확인 필요</span>
                  ),
                ],
              };
            })}
          />

          <Card className="p-4">
            <p className="text-[0.8125rem] leading-relaxed text-fg">{DISCLAIMER}</p>
            <p className="mt-2 text-xs leading-relaxed text-fg-muted">
              선박 크기별 통제 기준(소형선 우선 통제 등)은 항만 운영세칙·VTS 고시로 확인된 것이 없어 반영하지 않았습니다 — 항만별 기준 확인 필요.
              단기 해상예보·태풍 정보는 기상청 API허브 명세 확인 후 연결합니다. &ldquo;바람·파고 72h&rdquo;는 Open-Meteo 모델 예보로 등급에 넣지 않는
              참고값입니다(점선 = 풍속 {T.windKt}kt 기준). 태풍 경로는{" "}
              <a href="https://www.weather.go.kr/w/typhoon/report.do" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-fg">
                기상청 태풍정보
              </a>
              ·
              <a href="https://www.metoc.navy.mil/jtwc/jtwc.html" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-fg">
                JTWC
              </a>
              에서 확인하십시오.
            </p>
          </Card>

          {raw && (
            <Card className="p-4">
              <h2 className="text-sm font-semibold text-fg">특보 통보문 원문</h2>
              <dl className="mt-3 space-y-3 text-xs leading-relaxed">
                <div>
                  <dt className="type-label text-fg-label">특보 발효 현황</dt>
                  <dd className="mt-1 whitespace-pre-line text-fg-muted">{raw.t6 || "없음"}</dd>
                </div>
                <div>
                  <dt className="type-label text-fg-label">예비특보</dt>
                  <dd className="mt-1 whitespace-pre-line text-fg-muted">{raw.t7 || "없음"}</dd>
                </div>
                {raw.other && (
                  <div>
                    <dt className="type-label text-fg-label">참고사항</dt>
                    <dd className="mt-1 whitespace-pre-line text-fg-muted">{raw.other}</dd>
                  </div>
                )}
              </dl>
              <p className="mt-3 text-xs text-fg-muted">출처 기상청(공공누리 제1유형)</p>
            </Card>
          )}
        </div>
      </div>
    </>
  );

  const overseasPorts = OVERSEAS_PORTS.map((op) => ({ op, point: metOf(op.id, "overseas") }));
  const overseas = (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        {met.state === "ok" ? (
          <DataBadge grade="live" source="Open-Meteo" sourceUrl="https://open-meteo.com/" asOf={met.asOf} fetchedAt={met.fetchedAt} cadence="모델 갱신 시간별" />
        ) : met.state === "failed" ? (
          <DataBadge grade="stale" source="Open-Meteo" fetchedAt={met.lastSuccessAt ?? undefined} error={met.error} />
        ) : (
          <DataBadge grade="pending" source="Open-Meteo" />
        )}
        <p className="text-[0.8125rem] text-fg-muted">
          72시간 바람·돌풍·파고·시정 예보 · 기준 풍속 {T.windKt}kt · 파고 {T.waveM}m · 시정 1해리 미만
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <PortRiskMap
            points={overseasPorts.map(({ op, point }) => {
              const s = point ? summarizeMet(point) : null;
              const warn = s ? s.exceedHours[0] > 0 : false;
              return { id: op.id, lon: op.coord[0], lat: op.coord[1], label: op.name, colorToken: !s ? "--fg-faint" : warn ? "--warn" : "--up", hollow: !s };
            })}
            center={[78, 28]}
            zoom={1.6}
            ariaLabel="해외 항만 위치와 24시간 내 기준 초과 여부 지도 — 같은 내용이 옆 표에 있습니다"
            className="h-[20rem] lg:sticky lg:top-24 lg:h-[30rem]"
          />
          <p className="mt-3 text-xs leading-relaxed text-fg-muted">
            주황 = 24시간 안에 풍속·파고·시정 기준을 넘는 시간이 있음 · 초록 = 없음. 항만 위치는 UN/LOCODE 대표 좌표입니다.
          </p>
        </div>
        <div className="min-w-0 space-y-4 lg:col-span-7">
          <SimpleTable
            caption="해외 항만 72시간 기상"
            headers={["항만", "지금", "풍속 72h", "파고 72h", "최저 시정", "기준 초과(24·48·72h)"]}
            rows={overseasPorts.map(({ op, point }) => {
              const s = point ? summarizeMet(point) : null;
              return {
                key: op.id,
                cells: [
                  <span key="n" className="block whitespace-nowrap">
                    <span className="block font-medium text-fg">{op.name}</span>
                    <span className="mt-1 block text-xs text-fg-muted">
                      {op.country} · {op.locode}
                    </span>
                  </span>,
                  s ? (
                    <span key="now" className="num block whitespace-nowrap text-xs">
                      <span className="block text-fg">
                        {compass(s.now.dirDeg)} {formatNum(s.now.windKt, { decimals: 0 })}kt
                      </span>
                      <span className="block text-fg-muted">파고 {formatNum(s.now.waveM, { decimals: 1 })}m</span>
                    </span>
                  ) : (
                    "—"
                  ),
                  point ? (
                    <span key="w" className="block">
                      <MiniSeries values={point.windKt} threshold={T.windKt} label={`${op.name} 풍속`} unit="kt" />
                      <span className="num mt-1 block text-xs text-fg-muted">
                        최대 {formatNum(s!.maxWindKt, { decimals: 0 })}kt · 돌풍 {formatNum(s!.maxGustKt, { decimals: 0 })}kt
                      </span>
                    </span>
                  ) : (
                    "—"
                  ),
                  point ? (
                    <span key="h" className="block">
                      <MiniSeries values={point.waveM} threshold={T.waveM} label={`${op.name} 파고`} unit="m" />
                      <span className="num mt-1 block text-xs text-fg-muted">최대 {formatNum(s!.maxWaveM, { decimals: 1 })}m</span>
                    </span>
                  ) : (
                    "—"
                  ),
                  <span key="v" className="num whitespace-nowrap text-xs text-fg-muted">
                    {s?.minVisM !== null && s?.minVisM !== undefined ? `${formatNum(s.minVisM / 1852, { decimals: 1 })} nm` : "—"}
                  </span>,
                  <span key="x" className="num whitespace-nowrap text-xs">
                    {s ? (
                      <span className={s.exceedHours.some((h) => h > 0) ? "text-warn" : "text-fg-muted"}>{s.exceedHours.map((h) => `${h}h`).join(" · ")}</span>
                    ) : (
                      "—"
                    )}
                    {s?.firstExceed && (
                      <span className="block text-fg-muted">
                        처음 {formatKst(s.firstExceed.at)} {s.firstExceed.what.join("·")}
                      </span>
                    )}
                  </span>,
                ],
              };
            })}
          />
          <Card className="p-4">
            <p className="text-[0.8125rem] leading-relaxed text-fg">
              Open-Meteo 모델 예보(항만 인근 해상 격자)입니다. 도선·접안 중단 기준은 항만·터미널 규정을 확인하십시오. 태풍·사이클론은 각국 기상 당국과{" "}
              <a href="https://www.metoc.navy.mil/jtwc/jtwc.html" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-fg">
                JTWC
              </a>
              를 확인하십시오.
            </p>
            <p className="mt-2 text-xs text-fg-muted">Weather data by Open-Meteo.com (CC BY 4.0) · 시각은 한국시간</p>
          </Card>
        </div>
      </div>
    </>
  );

  return (
    <PageShell>
      <PageHeader
        eyebrow="OPERATIONS · PORT WEATHER"
        title="항만 기상 · 클로징 위험도"
        description="기상청 특보·예비특보·해상예보로 국내 12개 주요항의 입출항 위험을 5단계로 추정합니다. 근거를 그대로 보여줍니다."
        assumptions={ASSUMPTIONS}
        assumptionsTitle="등급 규칙 · 근거"
      />

      <Tabs
        aria-label="지역"
        listClassName="mb-6"
        items={[
          { value: "kr", label: "국내 12개 항", content: domestic },
          { value: "overseas", label: "해외 6개 항", content: overseas },
        ]}
      />
    </PageShell>
  );
}
