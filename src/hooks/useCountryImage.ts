import { useEffect, useState } from "react";

interface WikiImage {
  src: string;
  pageUrl: string;
}

const cache = new Map<string, WikiImage | null>();

/** 从 media-list 里挑一张真实照片（跳过国旗/徽章/定位地图/图表，尽量像风景或城市照片）。 */
function pickImage(items: any[]): string | null {
  const imgs = (items || []).filter((it) => it.type === "image" && it.srcset?.length);
  // 跳过：国旗、徽章、印玺、音频、定位/正射投影地图（与站内地图重复）、SVG 线描图等
  const skip =
    /Flag[_ ]of|Coat_of_arms|Emblem|Seal_of|\.ogg|\.oga|\.svg|Location|locator|orthographic|\bmap\b|globe|projection|\.map|(_|-)map(_|-|\.)/i;
  // 取第一张"真实照片"（跳过所有旗帜/地图）
  const real = imgs.find((it) => !skip.test(it.title || ""));
  // 兜底：都被跳过时退到第三张、否则第二张、否则第一张
  const chosen = real || imgs[2] || imgs[1] || imgs[0];
  if (!chosen) return null;
  const src = chosen.srcset[0]?.src as string | undefined;
  if (!src) return null;
  return src.startsWith("//") ? `https:${src}` : src;
}

async function fetchMediaImage(lang: string, title: string): Promise<WikiImage | null> {
  const url = `https://${lang}.wikipedia.org/api/rest_v1/page/media-list/${encodeURIComponent(
    title
  )}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return null;
  const json = await res.json();
  const src = pickImage(json?.items);
  if (!src) return null;
  return {
    src,
    pageUrl: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title)}`,
  };
}

async function fetchPageImage(lang: string, title: string): Promise<WikiImage | null> {
  const url = new URL(`https://${lang}.wikipedia.org/w/api.php`);
  url.searchParams.set("action", "query");
  url.searchParams.set("prop", "pageimages");
  url.searchParams.set("piprop", "thumbnail|original");
  url.searchParams.set("pithumbsize", "900");
  url.searchParams.set("redirects", "1");
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");
  url.searchParams.set("titles", title);

  const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
  if (!res.ok) return null;
  const json = await res.json();
  const page = Object.values(json?.query?.pages || {})[0] as any;
  const src = page?.thumbnail?.source || page?.original?.source;
  if (!src) return null;
  return {
    src,
    pageUrl: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(page?.title || title)}`,
  };
}

/**
 * 关联维基百科页面的代表图（跳过国旗，取"第二张/真实"图片，避免与国旗 emoji 重复）。
 * 优先当前语言，无图则另一语言兜底；结果缓存，失败静默降级。
 */
export function useCountryImage(
  titleZh: string | undefined,
  titleEn: string | undefined,
  locale: string
) {
  const [image, setImage] = useState<WikiImage | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const primary = locale === "zh" ? titleZh : titleEn;
    const fallback = locale === "zh" ? titleEn : titleZh;
    const primaryLang = locale === "zh" ? "zh" : "en";
    const fallbackLang = locale === "zh" ? "en" : "zh";
    if (!primary && !fallback) {
      setImage(null);
      return;
    }
    const key = `${primaryLang}:${primary || ""}|${fallbackLang}:${fallback || ""}`;
    if (cache.has(key)) {
      setImage(cache.get(key) ?? null);
      return;
    }

    let alive = true;
    setLoading(true);
    (async () => {
      let result: WikiImage | null = null;
      try {
        if (primary) result = await fetchMediaImage(primaryLang, primary);
        if (!result && primary) result = await fetchPageImage(primaryLang, primary);
        if (!result && fallback) result = await fetchMediaImage(fallbackLang, fallback);
        if (!result && fallback) result = await fetchPageImage(fallbackLang, fallback);
      } catch {
        result = null;
      }
      cache.set(key, result);
      if (alive) {
        setImage(result);
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [titleZh, titleEn, locale]);

  return { image, loading };
}
