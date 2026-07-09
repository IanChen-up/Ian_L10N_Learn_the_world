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
    label: "通义千问 Qwen",
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    model: "qwen-plus",
    site: "https://bailian.console.aliyun.com",
    recommended: true,
    note: {
      zh: "国内用户优先推荐：百炼稳定、便宜，近期要闻会自动尝试启用联网搜索。",
      en: "Recommended for China: stable, affordable, and recent-news requests can enable web search.",
    },
  },
  {
    id: "kimi-bailian",
    label: "Kimi (百炼联网)",
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    model: "Moonshot-Kimi-K2-Instruct",
    site: "https://bailian.console.aliyun.com",
    note: {
      zh: "想优先用 Kimi 又要联网新闻，建议走百炼里的 Kimi，并在近期要闻自动启用搜索。",
      en: "Use Kimi through Bailian when you want Kimi plus web-enabled recent-news requests.",
    },
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    baseURL: "https://api.deepseek.com/v1",
    model: "deepseek-chat",
    site: "https://platform.deepseek.com",
    note: {
      zh: "便宜、中文强，适合普通问答；官方普通 API 不适合直接获取近期新闻。",
      en: "Affordable and strong in Chinese; the standard API is not ideal for recent news.",
    },
  },
  {
    id: "kimi",
    label: "Kimi (月之暗面)",
    baseURL: "https://api.moonshot.cn/v1",
    model: "moonshot-v1-8k",
    site: "https://platform.moonshot.cn",
    note: {
      zh: "官方接口适合长上下文普通问答；联网搜索需工具链，本站近期新闻更推荐百炼 Kimi。",
      en: "Good for long-context chat; web search needs tools, so Bailian Kimi is preferred for news.",
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
