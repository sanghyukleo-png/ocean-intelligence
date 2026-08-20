// 외부 소스에서 실시간 수집을 시도하고, 실패하면 데모 데이터로 대체합니다.
// (샌드박스 빌드/프리뷰 환경은 외부 네트워크가 제한될 수 있어 항상 데모로 대체될 수 있습니다.)

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  image?: string;
}

export interface BunkerPrice {
  grade: string;
  price: number;
  changePct: number;
}

export interface LiveResult<T> {
  items: T;
  live: boolean;
}

const DEMO_NEWS: NewsItem[] = [
  {
    title: "글로벌 컨테이너선 발주, 대체연료 비중 절반 넘어서",
    link: "https://www.hellenicshippingnews.com/",
    pubDate: "데모",
    source: "해운 뉴스 (데모)",
  },
  {
    title: "탱커 시장, 정제유 물동량 증가에 운임 강세",
    link: "https://splash247.com/",
    pubDate: "데모",
    source: "해운 뉴스 (데모)",
  },
  {
    title: "IMO 배출규제 앞두고 노후 선대 해체 가속화",
    link: "https://www.hellenicshippingnews.com/",
    pubDate: "데모",
    source: "해운 뉴스 (데모)",
  },
];

const DEMO_BUNKER: BunkerPrice[] = [
  { grade: "VLSFO", price: 612, changePct: 1.4 },
  { grade: "IFO380", price: 548, changePct: -0.8 },
  { grade: "MGO", price: 742, changePct: 0.6 },
];

function stripCdata(s: string) {
  return s.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "").trim();
}

function parseRssItems(xml: string): NewsItem[] {
  const items: NewsItem[] = [];
  const blocks = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  for (const block of blocks) {
    const title = block.match(/<title>([\s\S]*?)<\/title>/)?.[1];
    const link = block.match(/<link>([\s\S]*?)<\/link>/)?.[1];
    const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1];
    const image =
      block.match(/<media:content[^>]*url="([^"]+)"/)?.[1] ??
      block.match(/<enclosure[^>]*url="([^"]+)"/)?.[1];
    if (title && link) {
      items.push({
        title: stripCdata(title),
        link: stripCdata(link),
        pubDate: pubDate ? new Date(pubDate).toLocaleDateString("ko-KR") : "",
        source: "Hellenic Shipping News",
        image,
      });
    }
  }
  return items;
}

export async function getShippingNews(): Promise<LiveResult<NewsItem[]>> {
  try {
    const res = await fetch("https://www.hellenicshippingnews.com/feed/", {
      next: { revalidate: 1800 },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) throw new Error("bad status");
    const xml = await res.text();
    const items = parseRssItems(xml).slice(0, 5);
    if (!items.length) throw new Error("empty feed");
    return { items, live: true };
  } catch {
    return { items: DEMO_NEWS, live: false };
  }
}

export async function getBunkerPrices(): Promise<LiveResult<BunkerPrice[]>> {
  try {
    const res = await fetch("https://shipandbunker.com/prices", {
      next: { revalidate: 1800 },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) throw new Error("bad status");
    const html = await res.text();
    const grades = ["VLSFO", "IFO380", "MGO"];
    const items: BunkerPrice[] = [];
    for (const grade of grades) {
      const re = new RegExp(`${grade}[\\s\\S]{0,300}?\\$?([0-9][0-9,]{1,6}\\.\\d{2})`, "i");
      const m = html.match(re);
      if (m) items.push({ grade, price: parseFloat(m[1].replace(/,/g, "")), changePct: 0 });
    }
    if (items.length < 3) throw new Error("parse incomplete");
    return { items, live: true };
  } catch {
    return { items: DEMO_BUNKER, live: false };
  }
}
