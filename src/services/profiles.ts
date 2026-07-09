import type { CountryProfile } from "@/types/profile";

const BASE = import.meta.env.BASE_URL || "/";

let indexCache: Record<string, true> | null = null;
const profileCache = new Map<string, CountryProfile | null>();

/** 加载"哪些国家有详细档案"的索引（一次性）。 */
async function loadProfileIndex(): Promise<Record<string, true>> {
  if (indexCache) return indexCache;
  try {
    const res = await fetch(`${BASE}data/profiles/index.json`);
    if (!res.ok) throw new Error(String(res.status));
    indexCache = (await res.json()) as Record<string, true>;
  } catch {
    indexCache = {};
  }
  return indexCache;
}

export async function hasProfile(iso: string): Promise<boolean> {
  const idx = await loadProfileIndex();
  return Boolean(idx[iso]);
}

/** 懒加载单个国家档案；不存在返回 null。 */
export async function loadProfile(iso: string): Promise<CountryProfile | null> {
  if (profileCache.has(iso)) return profileCache.get(iso)!;
  const idx = await loadProfileIndex();
  if (!idx[iso]) {
    profileCache.set(iso, null);
    return null;
  }
  try {
    const res = await fetch(`${BASE}data/profiles/${iso}.json`);
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as CountryProfile;
    profileCache.set(iso, data);
    return data;
  } catch {
    profileCache.set(iso, null);
    return null;
  }
}
