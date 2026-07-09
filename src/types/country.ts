/** 共享类型定义：国家本地化数据模型与维度 */

export type LocalizedText = {
  zh: string;
  en: string;
  [lang: string]: string;
};

/** 详情面板展示的六大知识维度 */
export type DisplayDimension =
  | "capital"
  | "currency"
  | "language"
  | "religion"
  | "government"
  | "holiday";

/** 可反向筛选 / 浏览的维度 */
export type FilterDimension =
  | "currency"
  | "language"
  | "religion"
  | "government"
  | "region";

export const FILTER_DIMENSIONS: FilterDimension[] = [
  "region",
  "currency",
  "language",
  "religion",
  "government",
];

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: LocalizedText;
}

export interface LanguageInfo {
  code: string;
  name: LocalizedText;
}

/** 语言的语言学元信息（按 ISO 639-3 code 共享，独立数据文件） */
export interface LanguageMeta {
  /** 语系，如 印欧语系 / 汉藏语系 */
  family: LocalizedText;
  /** 文字系统，如 拉丁字母 / 汉字 / 阿拉伯字母 */
  script: LocalizedText;
  /** 是否声调语言 */
  tonal?: boolean;
  /** 母语使用人数（约数） */
  speakers?: number;
}

export type LanguageMetaMap = Record<string, LanguageMeta>;

/** 用电与插头信息 */
export interface ElectricityInfo {
  /** 电压，如 220V / 100V / 127V·220V */
  voltage: string;
  /** 频率，如 50Hz / 60Hz / 50/60Hz */
  frequency: string;
  /** 插头类型字母，如 ["A","I"] */
  plugs: string[];
}

export interface ReligionInfo {
  /** 归一化 key，用于反向索引与 i18n 翻译，如 "buddhism" */
  key: string;
  /** 可选占比 0-100 */
  share?: number;
}

export interface HolidayInfo {
  name: LocalizedText;
  /** 展示用日期，如 "2 月中旬"、"07-04"，或按 UI 语言本地化的日期文本 */
  date?: string | LocalizedText;
  note?: LocalizedText;
}

export interface Country {
  /** ISO 3166-1 alpha-2 */
  iso: string;
  /** ISO 3166-1 alpha-3，与地图 TopoJSON 关联 */
  iso3: string;
  /** ISO 3166-1 numeric，与 world-atlas 要素 id 关联 */
  ccn3: string;
  name: LocalizedText;
  capital: LocalizedText;
  region: string; // region key: africa/americas/asia/europe/oceania/antarctic
  subregion: string;
  flag: string; // emoji
  currency: CurrencyInfo;
  languages: LanguageInfo[];
  religions: ReligionInfo[];
  /** government key, 经 i18n 翻译 */
  government: string;
  holidays: HolidayInfo[];
  latlng?: [number, number];
  /** 面积（平方公里） */
  area: number;
  landlocked: boolean;
  /** 国际区号，如 +81 */
  callingCode: string;
  /** 顶级域名，如 .jp */
  tld: string;
  /** 接壤国家 iso3 列表 */
  borders: string[];
  /** 人口 */
  population: number | null;
  /** GDP（美元） */
  gdp: number | null;
  /** 时区（UTC 偏移字符串数组，如 ["UTC+09:00"]） */
  timezones?: string[];
  /** 驾驶方向 */
  drivingSide?: "left" | "right";
  /** 一周起始日（日历惯例） */
  startOfWeek?: "monday" | "sunday" | "saturday";
  /** 度量制 */
  measurement?: "metric" | "imperial" | "mixed";
  /** 用电与插头 */
  electricity?: ElectricityInfo;
  /** GDP 数据年份 */
  gdpYear?: number;
  /** GDP 全球排名 */
  gdpRank?: number;
  /** 面积全球排名 */
  areaRank?: number;
  /** 人口全球排名 */
  populationRank?: number;
  /** 女性人口占比（%） */
  femaleShare?: number;
  /** 男女比例（每 100 名女性对应的男性数） */
  sexRatio?: number;
  /** 护照免签 / 落地签目的地数（Henley 类公开数据） */
  visaFree?: number;
  /** 互联网普及率（%） */
  internetPct?: number;
  /** 平均预期寿命（岁） */
  lifeExpectancy?: number;
  /** 人口密度（人/km²） */
  density?: number;
}

export interface DimensionIndexEntry {
  /** 归一化取值 key */
  value: string;
  /** 展示标签（对 currency/language/capital 直接给出双语；religion/government/region 走 i18n） */
  label?: LocalizedText;
  /** 命中的国家 iso 列表 */
  countries: string[];
}

export type DimensionIndex = Record<string, DimensionIndexEntry>;
