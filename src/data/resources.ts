import type { LocalizedText } from "@/types/country";

export interface ResourceLink {
  name: string;
  url: string;
  desc: LocalizedText;
  free: "free" | "freemium";
}

export interface ResourceCategory {
  key: string;
  title: LocalizedText;
  emoji: string;
  items: ResourceLink[];
}

/** 免费/可访问的本地化 & i18n 学习资源（来源经调研核对）。 */
export const RESOURCE_CATEGORIES: ResourceCategory[] = [
  {
    key: "time",
    emoji: "🕐",
    title: { zh: "时区与时间", en: "Time zones & time" },
    items: [
      {
        name: "timeanddate.com",
        url: "https://www.timeanddate.com",
        desc: { zh: "老牌权威：世界时钟、时区转换、会议规划、日历", en: "World clock, time zone converter, meeting planner and calendars" },
        free: "free",
      },
      {
        name: "World Time Buddy",
        url: "https://www.worldtimebuddy.com",
        desc: { zh: "可视化多时区对比，跨时区排会神器", en: "Visual multi-zone comparison; great for scheduling across zones" },
        free: "free",
      },
    ],
  },
  {
    key: "i18n",
    emoji: "🌐",
    title: { zh: "国际化标准与工具", en: "i18n standards & tools" },
    items: [
      {
        name: "Unicode CLDR",
        url: "https://cldr.unicode.org",
        desc: { zh: "本地化数据的事实标准：日期、数字、度量、周起始", en: "The de-facto locale data standard: dates, numbers, measurement, week start" },
        free: "free",
      },
      {
        name: "Unicode",
        url: "https://home.unicode.org",
        desc: { zh: "字符集、Emoji、文字与双向排版规范的权威源", en: "Authoritative source for character sets, Emoji, scripts and BiDi" },
        free: "free",
      },
      {
        name: "ICU",
        url: "https://icu.unicode.org",
        desc: { zh: "i18n 底层库：格式化、排序、分词的实现文档", en: "The i18n workhorse library: formatting, collation, segmentation" },
        free: "free",
      },
      {
        name: "W3C Internationalization",
        url: "https://www.w3.org/International/",
        desc: { zh: "Web 国际化权威指南，含书写方向与字符编码", en: "Authoritative Web i18n guidance, incl. writing direction and encoding" },
        free: "free",
      },
      {
        name: "r12a Unicode 工具集",
        url: "https://r12a.github.io",
        desc: { zh: "脚本 / 书写系统 / BiDi / 字符检查的专业小工具合集", en: "Pro toolkit for scripts, writing systems, BiDi and character inspection" },
        free: "free",
      },
      {
        name: "IANA Language Subtags",
        url: "https://www.iana.org/assignments/language-subtag-registry",
        desc: { zh: "BCP 47 语言标签官方注册表", en: "Official BCP 47 language tag registry" },
        free: "free",
      },
    ],
  },
  {
    key: "language",
    emoji: "🗣️",
    title: { zh: "语言与文字", en: "Languages & scripts" },
    items: [
      {
        name: "Ethnologue",
        url: "https://www.ethnologue.com",
        desc: { zh: "语言 / 语系 / 使用人数的权威数据库", en: "Authoritative database of languages, families and speaker counts" },
        free: "freemium",
      },
      {
        name: "Glottolog",
        url: "https://glottolog.org",
        desc: { zh: "语系谱系树学术数据库，比 Ethnologue 更学术", en: "Academic database of language genealogies" },
        free: "free",
      },
      {
        name: "Omniglot",
        url: "https://www.omniglot.com",
        desc: { zh: "世界书写系统与语言百科，示例丰富", en: "Encyclopedia of writing systems and languages with rich samples" },
        free: "free",
      },
      {
        name: "ScriptSource",
        url: "https://scriptsource.org",
        desc: { zh: "世界文字系统百科（SIL 出品）", en: "Reference on the world's writing systems (by SIL)" },
        free: "free",
      },
      {
        name: "Keyman",
        url: "https://keyman.com",
        desc: { zh: "3000+ 语言的键盘输入方案，助非拉丁文字输入", en: "Keyboards for 3000+ languages; type non-Latin scripts" },
        free: "free",
      },
    ],
  },
  {
    key: "convert",
    emoji: "🔌",
    title: { zh: "货币、度量与用电", en: "Currency, units & power" },
    items: [
      {
        name: "XE Currency",
        url: "https://www.xe.com",
        desc: { zh: "实时汇率换算与货币信息", en: "Live currency exchange rates and info" },
        free: "freemium",
      },
      {
        name: "IEC World Plugs",
        url: "https://www.iec.ch/world-plugs",
        desc: { zh: "各国插头 / 电压 / 频率官方参考", en: "Official reference for plugs, voltage and frequency by country" },
        free: "free",
      },
      {
        name: "worldstandards.eu",
        url: "https://www.worldstandards.eu/electricity/plug-voltage-by-country/",
        desc: { zh: "逐国插头电压详表，比 IEC 更细", en: "Detailed per-country plug & voltage tables" },
        free: "free",
      },
    ],
  },
];
