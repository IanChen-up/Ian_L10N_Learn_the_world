import type { LocalizedText } from "./country";

/** 数据来源引用：展示为可点击的"了解详情 / 数据来源"链接 */
export interface SourceRef {
  /** 来源机构名，如 世界银行 / 联合国 / 维基百科 */
  label: LocalizedText;
  url: string;
  /** 数据年份，可选 */
  year?: string;
}

/** 常用语（你好/谢谢等），支持点击 TTS 朗读 */
export interface Phrase {
  /** 常用语类别 key：hello / thanks / goodbye / yes / no ... */
  key: string;
  /** 目标语言中的写法 */
  text: string;
  /** 罗马音/拼音，便于跟读 */
  romanization?: string;
  /** 用于 TTS 的 BCP-47 语言代码，如 zh-CN / ar-SA */
  langTag?: string;
}

/** 本地化注意事项（面向 i18n 从业者） */
export interface LocalizationNotes {
  /** 书写方向 */
  direction: "ltr" | "rtl";
  /** 语言是否有语法阴阳性 */
  grammaticalGender?: boolean;
  /** 颜色禁忌/文化含义 */
  colorNotes?: LocalizedText[];
  /** 文化禁忌与礼仪 */
  culturalTaboos?: LocalizedText[];
  /** 其它本地化提示（日期格式、数字、姓名顺序等） */
  formatting?: LocalizedText[];
}

/** 足球/世界杯相关 */
export interface FootballInfo {
  /** 国际足联男足排名 */
  fifaRank?: number;
  /** 世界杯夺冠次数 */
  worldCupTitles?: number;
  /** 简要战绩描述 */
  note?: LocalizedText;
}

/** 国家的丰富档案（懒加载，不进入主 countries.json） */
export interface CountryProfile {
  iso: string;
  /** 国家简介段落 */
  overview?: LocalizedText;
  /** 首都历史/由来 */
  capitalHistory?: LocalizedText;
  /** 气候类型描述 */
  climate?: LocalizedText;
  /** 常用语（可 TTS 播放） */
  phrases?: Phrase[];
  /** 国歌 */
  anthem?: { name: LocalizedText; note?: LocalizedText; source?: SourceRef };
  /** 国家象征：国花/国鸟/国兽等 */
  symbols?: { key: string; name: LocalizedText }[];
  /** 官方/主要语言的字母表字母数 */
  alphabetCount?: number;
  /** QS 世界大学排名前 100 的高校数量 */
  qsTop100?: number;
  /** 世界文化与自然遗产数量 */
  unescoSites?: number;
  /** 足球信息 */
  football?: FootballInfo;
  /** 本地化注意事项 */
  localization?: LocalizationNotes;
  /** 趣味冷知识 */
  funFacts?: LocalizedText[];
  /** 各字段数据来源：字段名 → 来源引用 */
  sources?: Record<string, SourceRef>;
}
