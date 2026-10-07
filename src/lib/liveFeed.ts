// 뉴스 헤드라인 수집. 실패하면 가짜 기사로 채우지 않고 실패 상태를 그대로 돌려준다.
// (벙커유 가격은 지시서 11.2에 따라 Phase 2.5의 소스 어댑터로 이전 — 약관상 재게시 금지 사이트의 스크래핑은 제거)

export interface NewsItem {
  title: string;
  link: string;
  /** ISO 시각 (파싱 실패 시 null) */
  publishedAt: string | null;
  source: string;
}

export type NewsResult =
  | { ok: true; items: NewsItem[]; fetchedAt: string; source: string; sourceUrl: string }
  | { ok: false; error: string; fetchedAt: string; source: string; sourceUrl: string };

const FEED = {
  name: "Hellenic Shipping News",
  url: "https://www.hellenicshippingnews.com/feed/",
  site: "https://www.hellenicshippingnews.com/",
};

function stripCdata(s: string) {
  return s.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "").trim();
}

function decodeEntities(s: string) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export function parseRssItems(xml: string, source: string): NewsItem[] {
  const items: NewsItem[] = [];
  const blocks = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  for (const block of blocks) {
    const title = block.match(/<title>([\s\S]*?)<\/title>/)?.[1];
    const link = block.match(/<link>([\s\S]*?)<\/link>/)?.[1];
    const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1];
    if (!title || !link) continue;
    const date = pubDate ? new Date(stripCdata(pubDate)) : null;
    items.push({
      title: decodeEntities(stripCdata(title)),
      link: stripCdata(link),
      publishedAt: date && !Number.isNaN(date.getTime()) ? date.toISOString() : null,
      source,
    });
  }
  return items;
}

export async function getShippingNews(limit = 5): Promise<NewsResult> {
  const fetchedAt = new Date().toISOString();
  const base = { fetchedAt, source: FEED.name, sourceUrl: FEED.site };
  try {
    const res = await fetch(FEED.url, { next: { revalidate: 1800 }, signal: AbortSignal.timeout(4000) });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}`, ...base };
    // 캐시된 응답이면 렌더 시각이 아니라 원 응답 시각이 실제 수집 시각이다
    const served = res.headers.get("date");
    const collectedAt = served && !Number.isNaN(Date.parse(served)) ? new Date(served).toISOString() : fetchedAt;
    const items = parseRssItems(await res.text(), FEED.name).slice(0, limit);
    if (!items.length) return { ok: false, error: "빈 피드", ...base };
    return { ok: true, items, ...base, fetchedAt: collectedAt };
  } catch (e) {
    return { ok: false, error: e instanceof Error && e.name === "TimeoutError" ? "시간 초과" : "네트워크 오류", ...base };
  }
}
