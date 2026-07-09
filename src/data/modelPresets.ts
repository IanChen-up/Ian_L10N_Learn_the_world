export interface ModelPreset {
  id: string;
  label: string;
  baseURL: string;
  model: string;
  /** 获取 API Key 的官网 */
  site: string;
  /** 是否推荐 */
  recommended?: boolean;
  /** 简短说明（中英） */
  note: { zh: string; en: string };
}

/** 主流 OpenAI 兼容模型服务预设（均需在官网充值/申请 Key 后使用）。 */
export const MODEL_PRESETS: ModelPreset[] = [
  {
    id: "qwen",
    label: "通义千问 Qwen 3.7 Plus",
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    model: "qwen3.7-plus",
    site: "https://bailian.console.aliyun.com",
    recommended: true,
    note: {
      zh: "默认推荐：百炼国内访问稳定，模型更新到 Qwen 3.7 Plus；近期要闻优先走官方媒体搜索结果再总结。",
      en: "Default recommendation: stable in China, updated to Qwen 3.7 Plus; news is summarized from official-media search results first.",
    },
  },
  {
    id: "qwen-max",
    label: "通义千问 Qwen Max",
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    model: "qwen3-max",
    site: "https://bailian.console.aliyun.com",
    note: {
      zh: "更强但成本更高，适合复杂总结与高质量输出；普通使用优先 Qwen 3.7 Plus。",
      en: "Stronger but more expensive; useful for high-quality summaries. Qwen 3.7 Plus remains the daily default.",
    },
  },
  {
    id: "kimi-bailian",
    label: "Kimi (百炼联网)",
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    model: "Moonshot-Kimi-K2-Instruct",
    site: "https://bailian.console.aliyun.com",
    note: {
      zh: "想优先用 Kimi，建议走百炼里的 Kimi；近期新闻由搜索代理提供官方媒体上下文。",
      en: "Use Kimi through Bailian when you prefer Kimi; recent news uses official-media search context.",
    },
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    baseURL: "https://api.deepseek.com/v1",
    model: "deepseek-chat",
    site: "https://platform.deepseek.com",
    note: {
      zh: "便宜、中文强，适合普通问答；近期新闻必须依赖本站搜索代理提供上下文。",
      en: "Affordable and strong in Chinese; recent news needs this site's search proxy for context.",
    },
  },
  {
    id: "kimi",
    label: "Kimi (月之暗面)",
    baseURL: "https://api.moonshot.cn/v1",
    model: "moonshot-v1-8k",
    site: "https://platform.moonshot.cn",
    note: {
      zh: "官方接口适合长上下文普通问答；近期新闻必须依赖本站搜索代理提供上下文。",
      en: "Good for long-context chat; recent news needs this site's search proxy for context.",
    },
  },
  {
    id: "perplexity",
    label: "Perplexity Sonar",
    baseURL: "https://api.perplexity.ai",
    model: "sonar",
    site: "https://www.perplexity.ai/settings/api",
    note: {
      zh: "海外联网检索模型，近期新闻效果好；国内用户可作为备选。",
      en: "Web-search capable and good for recent news; an optional non-China provider.",
    },
  },
  {
    id: "openai",
    label: "OpenAI",
    baseURL: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
    site: "https://platform.openai.com",
    note: {
      zh: "老牌通用，需海外支付渠道充值。",
      en: "The classic; requires an overseas payment method.",
    },
  },
];
