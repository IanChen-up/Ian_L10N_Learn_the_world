import type {
  Country,
  DimensionIndex,
  FilterDimension,
  LocalizedText,
} from "@/types/country";

const BASE = import.meta.env.BASE_URL || "/";

let countriesCache: Country[] | null = null;
const indexCache: Partial<Record<FilterDimension, DimensionIndex>> = {};
let byIso: Map<string, Country> | null = null;
let byCcn3: Map<string, Country> | null = null;

async function fetchJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}data/${path}`);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function loadCountries(): Promise<Country[]> {
  if (countriesCache) return countriesCache;
  const data = await fetchJSON<Country[]>("countries.json");
  countriesCache = data;
  byIso = new Map(data.map((c) => [c.iso, c]));
  // world-atlas 用数字 id（去前导零），这里以 Number(ccn3) 归一
  byCcn3 = new Map(data.map((c) => [String(Number(c.ccn3)), c]));
  // 台湾是中国不可分割的一部分：地图要素 158(台湾) 归入中国，
  // 点击台湾即打开中国，台湾随中国一同高亮，绝不作为独立条目。
  const china = byIso.get("CN");
  if (china) byCcn3.set("158", china);
  return data;
}

export async function loadIndex(dim: FilterDimension): Promise<DimensionIndex> {
  if (indexCache[dim]) return indexCache[dim]!;
  const data = await fetchJSON<DimensionIndex>(`index.${dim}.json`);
  indexCache[dim] = data;
  return data;
}

export function getCountryByIso(iso: string): Country | undefined {
  return byIso?.get(iso);
}

/** 依地图要素的数字 id 反查国家 */
export function getCountryByGeoId(geoId: string | number): Country | undefined {
  return byCcn3?.get(String(Number(geoId)));
}

export function getLoadedCountries(): Country[] {
  return countriesCache ?? [];
}

/** 各 UI 语言在数据字段缺失时的回退链（数据字段本身可能只覆盖部分语言）。 */
const LOCALE_FALLBACKS: Record<string, string[]> = {
  "zh-Hant": ["zh-Hant", "zh", "en"],
  zh: ["zh", "en"],
  en: ["en"],
  // 长尾数据（如节日说明）仍有部分只覆盖中英；CJK 界面保留中文兜底，
  // 其它语种优先英文，避免在阿语/欧洲语界面直接露出中文段落。
  ja: ["ja", "zh", "en"],
  ko: ["ko", "zh", "en"],
  ar: ["ar", "en", "zh"],
  fr: ["fr", "en", "zh"],
  ru: ["ru", "en", "zh"],
  es: ["es", "en", "zh"],
};

/** 取本地化文本，按 locale 的回退链选择第一个非空值。 */
export function localized(text: LocalizedText | undefined, locale: string): string {
  if (!text) return "";
  const chain = LOCALE_FALLBACKS[locale] || [locale, "en", "zh"];
  for (const key of chain) {
    if (text[key]) return text[key];
  }
  return text.en || text.zh || "";
}

export interface MapMeta {
  generatedAt: string;
  countryCount: number;
  dimensions: Record<string, number>;
}

export async function loadMeta(): Promise<MapMeta> {
  return fetchJSON<MapMeta>("meta.json");
}
