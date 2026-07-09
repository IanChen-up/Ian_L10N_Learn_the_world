/**
 * Cloudflare Worker 示例：近期新闻搜索代理。
 *
 * 用法：
 * 1. 部署本文件作为 Cloudflare Worker / Serverless Function。
 * 2. 将 src/config/site.ts 的 NEWS_SEARCH_PROXY_URL 改为 Worker 地址。
 * 3. 可选：配置 TAVILY_API_KEY。若未配置，Worker 会自动改用搜索引擎 RSS。
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

const OFFICIAL_MEDIA_SOURCES = [
  { label: "人民日报", domains: ["people.com.cn"] },
  { label: "人民日报海外版", domains: ["haiwainet.cn"] },
  { label: "新华社", domains: ["xinhuanet.com", "news.cn"] },
  { label: "央视网", domains: ["cctv.com", "cntv.cn"] },
  { label: "央广网", domains: ["cnr.cn"] },
  { label: "中国日报", domains: ["chinadaily.com.cn"] },
  { label: "CGTN", domains: ["cgtn.com"] },
  { label: "中国新闻网", domains: ["chinanews.com.cn", "ecns.cn"] },
  { label: "国际在线", domains: ["cri.cn"] },
  { label: "光明网", domains: ["gmw.cn"] },
  { label: "中国经济网", domains: ["ce.cn"] },
  { label: "中国网", domains: ["china.com.cn"] },
  { label: "中国青年报", domains: ["youth.cn", "cyol.com"] },
  { label: "科技日报", domains: ["stdaily.com"] },
  { label: "法治日报", domains: ["legaldaily.com.cn"] },
  { label: "环球网", domains: ["huanqiu.com"] },
];

const OFFICIAL_MEDIA_DOMAINS = OFFICIAL_MEDIA_SOURCES.flatMap((s) => s.domains);
const RSS_TIMEOUT_MS = 9000;

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

function decodeHtml(input = "") {
  return String(input)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/<[^>]+>/g, "")
    .trim();
}

function officialSourceFromUrl(url = "") {
  const host = sourceFromUrl(url);
  if (!host) return null;
  return OFFICIAL_MEDIA_SOURCES.find((source) =>
    source.domains.some((domain) => host === domain || host.endsWith(`.${domain}`))
  );
}

function isOfficialUrl(url = "") {
  return Boolean(officialSourceFromUrl(url));
}

function itemTag(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? decodeHtml(match[1]) : "";
}

function sourceTag(xml) {
  const match = xml.match(/<source(?:\s+url="([^"]+)")?[^>]*>([\s\S]*?)<\/source>/i);
  if (!match) return { source: "", sourceUrl: "" };
  return { source: decodeHtml(match[2]), sourceUrl: decodeHtml(match[1] || "") };
}

function parseRss(xml, forcedSource = "") {
  const items = [];
  const blocks = String(xml).match(/<item[\s\S]*?<\/item>/gi) || [];
  for (const block of blocks) {
    const title = itemTag(block, "title");
    const link = itemTag(block, "link");
    const pubDate = itemTag(block, "pubDate");
    const description = itemTag(block, "description");
    const sourceInfo = sourceTag(block);
    const sourceUrl = sourceInfo.sourceUrl || link;
    const official = officialSourceFromUrl(sourceUrl) || officialSourceFromUrl(link);
    if (!title) continue;
    items.push({
      title,
      url: isOfficialUrl(link) ? link : sourceUrl || link,
      source: forcedSource || official?.label || sourceInfo.source || sourceFromUrl(link),
      publishedAt: pubDate,
      snippet: description,
    });
  }
  return items;
}

function isUsefulNewsItem(item, country = "") {
  const text = `${item.title || ""} ${item.snippet || ""}`;
  if (!item.title || item.title.length < 8) return false;
  if (/[\u3400-\u9fff]/.test(country) && country !== "中国" && !text.includes(country)) return false;
  const badPatterns = [
    /让新闻离你更近/,
    /网上的人民日报/,
    /图文数据库/,
    /首页$/,
    /频道$/,
    /客户端下载/,
    /版权声明/,
    /广告服务/,
    /投稿/,
    /搜索$/,
  ];
  if (badPatterns.some((re) => re.test(text))) return false;
  return true;
}

async function fetchTextWithTimeout(url, signal) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), RSS_TIMEOUT_MS);
  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 AtlasNewsBot/1.0",
        "Accept": "application/rss+xml, application/xml, text/xml, text/html;q=0.9,*/*;q=0.8",
      },
      signal: controller.signal,
    });
    if (!res.ok) return "";
    return await res.text();
  } catch {
    return "";
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", onAbort);
  }
}

function buildSearchQuery(country, months, domains) {
  const siteQuery = domains.map((domain) => `site:${domain}`).join(" OR ");
  const year = new Date().getUTCFullYear();
  return `(${siteQuery}) ${country} ${year} 最近 ${months} 个月 重要 新闻 要闻`;
}

function googleNewsRssUrl(query) {
  const url = new URL("https://news.google.com/rss/search");
  url.searchParams.set("q", query);
  url.searchParams.set("hl", "zh-CN");
  url.searchParams.set("gl", "CN");
  url.searchParams.set("ceid", "CN:zh-Hans");
  return url.toString();
}

function bingNewsRssUrl(query) {
  const url = new URL("https://cn.bing.com/news/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "rss");
  url.searchParams.set("mkt", "zh-CN");
  return url.toString();
}

function dedupeItems(items, country = "") {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = `${item.title} ${item.url || ""}`.toLowerCase().replace(/\s+/g, " ").trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    if (isUsefulNewsItem(item, country)) out.push(item);
  }
  return out;
}

async function searchViaRss(country, months, signal) {
  const batches = [
    ["people.com.cn", "haiwainet.cn", "xinhuanet.com", "news.cn"],
    ["cctv.com", "cnr.cn", "cri.cn", "china.com.cn"],
    ["chinanews.com.cn", "ecns.cn", "chinadaily.com.cn", "cgtn.com"],
    ["gmw.cn", "ce.cn", "youth.cn", "cyol.com", "stdaily.com", "legaldaily.com.cn", "huanqiu.com"],
  ];
  const googleJobs = batches.map(async (domains) => {
    const xml = await fetchTextWithTimeout(googleNewsRssUrl(buildSearchQuery(country, months, domains)), signal);
    return parseRss(xml);
  });
  const bingJobs = batches.map(async (domains) => {
    const xml = await fetchTextWithTimeout(bingNewsRssUrl(buildSearchQuery(country, months, domains)), signal);
    return parseRss(xml);
  });
  const items = dedupeItems([...(await Promise.all(googleJobs)).flat(), ...(await Promise.all(bingJobs)).flat()], country);

  return items.slice(0, 12);
}

async function searchViaTavily(env, country, locale, months) {
  const query =
    locale === "zh" || locale === "zh-Hant"
      ? `${country} 最近 ${months} 个月 重要 新闻 要闻 国内官方媒体`
      : `${country} recent major news last ${months} months Chinese official media`;

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: env.TAVILY_API_KEY,
      query,
      search_depth: "advanced",
      max_results: 12,
      include_answer: false,
      include_raw_content: false,
      include_domains: OFFICIAL_MEDIA_DOMAINS,
    }),
  });

  if (!res.ok) return [];
  const payload = await res.json();
  return (payload.results || [])
    .filter((item) => isOfficialUrl(item.url || ""))
    .map((item) => ({
      title: item.title || "",
      url: item.url || "",
      source: officialSourceFromUrl(item.url || "")?.label || sourceFromUrl(item.url),
      publishedAt: item.published_date || item.publishedAt || "",
      snippet: item.content || item.snippet || "",
    }));
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    if (request.method !== "GET") {
      return json({ error: "Method not allowed" }, { status: 405 });
    }
    const url = new URL(request.url);
    const country = (url.searchParams.get("country") || "").trim();
    const locale = (url.searchParams.get("locale") || "zh").trim();
    const months = Number(url.searchParams.get("months") || "3");
    if (!country) {
      return json({ error: "Missing country" }, { status: 400 });
    }

    const tavilyItems = env.TAVILY_API_KEY ? await searchViaTavily(env, country, locale, months) : [];
    const items = tavilyItems.length >= 5
      ? tavilyItems
      : dedupeItems([...tavilyItems, ...(await searchViaRss(country, months, request.signal))], country);

    return json({ items: items.slice(0, 12), sourcePolicy: "official-mainland-media" });
  },
};
