import type { LocalizedText } from "@/types/country";

export interface LanguageFamilyEntry {
  label: LocalizedText;
  countries: string[];
}

export type LanguageFamilies = Record<string, LanguageFamilyEntry>;

const BASE = import.meta.env.BASE_URL || "/";
let cache: LanguageFamilies | null = null;
let inflight: Promise<LanguageFamilies> | null = null;

/** 加载「语言 → 语系」索引，供按语系筛选国家。 */
export async function loadLanguageFamilies(): Promise<LanguageFamilies> {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = fetch(`${BASE}data/language-families.json`)
    .then((r) => (r.ok ? r.json() : {}))
    .then((d: LanguageFamilies) => {
      cache = d || {};
      return cache;
    })
    .catch(() => ({}));
  return inflight;
}
