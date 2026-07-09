/**
 * Cloudflare Worker 示例：近期新闻搜索代理。
 *
 * 用法：
 * 1. 在 Cloudflare Worker 里创建环境变量 TAVILY_API_KEY。
 * 2. 部署本文件作为 Worker。
 * 3. 将 src/config/site.ts 的 NEWS_SEARCH_PROXY_URL 改为 Worker 地址。
 *
 * 前端请求：
 *   GET /?country=中国&locale=zh&months=3
 *
 * 返回：
 *   { items: [{ title, url, source, publishedAt, snippet }] }
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const OFFICIAL_MEDIA_DOMAINS = [
  "xinhuanet.com",
  "people.com.cn",
  "cctv.com",
  "chinanews.com.cn",
  "cgtn.com",
  "chinadaily.com.cn",
];

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...CORS_HEADERS,
      ...(init.headers || {}),
    },
  });
}

function sourceFromUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    if (request.method !== "GET") {
      return json({ error: "Method not allowed" }, { status: 405 });
    }
    if (!env.TAVILY_API_KEY) {
      return json({ error: "Missing TAVILY_API_KEY" }, { status: 500 });
    }

    const url = new URL(request.url);
    const country = (url.searchParams.get("country") || "").trim();
    const locale = (url.searchParams.get("locale") || "zh").trim();
    const months = Number(url.searchParams.get("months") || "3");
    if (!country) {
      return json({ error: "Missing country" }, { status: 400 });
    }

    const query =
      locale === "zh" || locale === "zh-Hant"
        ? `${country} 最近 ${months} 个月 重要 新闻 OR 要闻`
        : `${country} major recent news last ${months} months`;

    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: env.TAVILY_API_KEY,
        query,
        search_depth: "advanced",
        max_results: 10,
        include_answer: false,
        include_raw_content: false,
        include_domains: OFFICIAL_MEDIA_DOMAINS,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return json({ error: `Search failed (${res.status})`, detail: text.slice(0, 300) }, { status: 502 });
    }

    const payload = await res.json();
    const items = (payload.results || []).map((item) => ({
      title: item.title || "",
      url: item.url || "",
      source: sourceFromUrl(item.url),
      publishedAt: item.published_date || item.publishedAt || "",
      snippet: item.content || item.snippet || "",
    }));

    return json({ items });
  },
};

