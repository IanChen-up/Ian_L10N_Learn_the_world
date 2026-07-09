import type { LocalizedText } from "./country";

export interface Dialect {
  name: LocalizedText;
  /** 方言派系，如 官话·北京官话 / 吴语 / 粤语 */
  family: LocalizedText;
}

export interface EthnicGroup {
  name: LocalizedText;
  /** 占比 0-100，可选 */
  share?: number;
}

export interface ProvinceHighlight {
  name: LocalizedText;
  note?: LocalizedText;
}

export interface ProvinceGdpSource {
  label: LocalizedText;
  url?: string;
}

/** 省级行政区（本地化知识） */
export interface Province {
  /** 与地图要素 name 一致的中文名，如 广东省 */
  name: string;
  nameEn: string;
  /** 简称，如 粤 */
  abbr?: string;
  capital: LocalizedText;
  capitalNote?: LocalizedText;
  population?: number;
  /** GDP，亿元人民币 */
  gdpCNY?: number;
  /** GDP，美元 */
  gdpUSD?: number;
  /** GDP 历史序列 key，对应 public/data/province-gdp-history.json */
  gdpHistoryKey?: string;
  /** GDP 最新年份 */
  gdpYear?: number;
  /** GDP 数据来源说明 */
  gdpSource?: ProvinceGdpSource;
  areaKm2?: number;
  dialects: Dialect[];
  ethnicGroups: EthnicGroup[];
  /** 宗教 key 列表（走 i18n religion.* 翻译） */
  religions: string[];
  highlights: ProvinceHighlight[];
}

export type ProvinceMap = Record<string, Province>;
