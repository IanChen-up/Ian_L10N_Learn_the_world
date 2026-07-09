import { STATS_API_URL } from "@/config/site";

/** 站点计数：真实、免登录、可多次点赞。由后端 server/stats-server.mjs 持久化。 */
export interface SiteStats {
  views: number;
  likes: number;
}

const endpoint = STATS_API_URL.replace(/\/+$/, "");

/** 记录一次访问并返回最新计数（每次进入首页调用一次）。 */
export async function recordView(): Promise<SiteStats | null> {
  if (!endpoint) return null;
  try {
    const res = await fetch(`${endpoint}/view`, { method: "POST" });
    if (!res.ok) return null;
    return (await res.json()) as SiteStats;
  } catch {
    return null;
  }
}

/** 点赞一次（允许重复），返回最新计数。 */
export async function addLike(): Promise<SiteStats | null> {
  if (!endpoint) return null;
  try {
    const res = await fetch(`${endpoint}/like`, { method: "POST" });
    if (!res.ok) return null;
    return (await res.json()) as SiteStats;
  } catch {
    return null;
  }
}

export const statsEnabled = Boolean(endpoint);
