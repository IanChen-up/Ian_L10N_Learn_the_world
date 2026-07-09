import { NEWS_SEARCH_PROXY_URL } from "@/config/site";

export interface NewsSearchItem {
  title: string;
  url?: string;
  source?: string;
  publishedAt?: string;
  snippet?: string;
}

export interface NewsSearchPayload {
  items?: NewsSearchItem[];
}

function normalizeItems(payload: NewsSearchPayload | NewsSearchItem[]): NewsSearchItem[] {
  const items = Array.isArray(payload) ? payload : payload.items || [];
  return items
    .filter((item) => item && typeof item.title === "string" && item.title.trim())
    .slice(0, 12)
    .map((item) => ({
      title: item.title.trim(),
      url: item.url,
      source: item.source,
      publishedAt: item.publishedAt,
      snippet: item.snippet,
    }));
}

export async function searchRecentNews(
  countryName: string,
  locale: string,
  signal?: AbortSignal,
): Promise<NewsSearchItem[]> {
  if (!NEWS_SEARCH_PROXY_URL) return [];
  const url = new URL(NEWS_SEARCH_PROXY_URL, window.location.origin);
  url.searchParams.set("country", countryName);
  url.searchParams.set("locale", locale);
  url.searchParams.set("months", "3");

  const res = await fetch(url.toString(), { signal });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`News search failed (${res.status}): ${text.slice(0, 160)}`);
  }
  const payload = (await res.json()) as NewsSearchPayload | NewsSearchItem[];
  return normalizeItems(payload);
}

export function formatNewsContext(items: NewsSearchItem[]): string {
  return items
    .map((item, idx) => {
      const meta = [item.source, item.publishedAt, item.url].filter(Boolean).join(" | ");
      const snippet = item.snippet ? `\n   摘要/Snippet: ${item.snippet}` : "";
      return `${idx + 1}. ${item.title}${meta ? `\n   ${meta}` : ""}${snippet}`;
    })
    .join("\n");
}

