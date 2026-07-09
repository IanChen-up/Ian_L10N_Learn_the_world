import { useState, useCallback, useRef } from "react";
import { useAIStore } from "@/stores/useAIStore";
import { createProvider, type ChatMessage } from "@/services/ai/provider";
import { formatNewsContext, searchRecentNews } from "@/services/newsSearch";

export interface NewsState {
  loading: boolean;
  text: string;
  error: string | null;
  done: boolean;
}

function canModelBrowse(baseURL: string, model: string): boolean {
  const base = baseURL.toLowerCase();
  const name = model.toLowerCase();
  return (
    base.includes("perplexity.ai") ||
    base.includes("dashscope.aliyuncs.com") ||
    base.includes(".maas.aliyuncs.com") ||
    name.includes("perplexity") ||
    name.includes("sonar") ||
    name.includes(":online") ||
    name.includes("web-search")
  );
}

function shouldPassEnableSearch(baseURL: string, model: string): boolean {
  const base = baseURL.toLowerCase();
  const name = model.toLowerCase();
  return (
    (base.includes("dashscope.aliyuncs.com") || base.includes(".maas.aliyuncs.com")) &&
    (name.includes("qwen") || name.includes("deepseek") || name.includes("kimi"))
  );
}

function noLiveSearchMessage(locale: string): string {
  if (locale === "zh" || locale === "zh-Hant") {
    return "当前模型没有联网检索能力，不能可靠获取最近新闻。请配置本站新闻搜索代理：它会先搜索国内官方媒体近期报道，再交给 AI 总结；不要让普通模型直接编近期新闻。";
  }
  if (locale === "ja") {
    return "現在のモデルにはウェブ検索機能がないため、最近のニュースを確実に取得できません。ニュース検索プロキシを設定するか、検索対応モデルを使用してください。";
  }
  if (locale === "ko") {
    return "현재 모델에는 웹 검색 기능이 없어 최신 뉴스를 안정적으로 가져올 수 없습니다. 뉴스 검색 프록시를 설정하거나 검색 지원 모델을 사용해 주세요.";
  }
  if (locale === "ar") {
    return "النموذج الحالي لا يملك قدرة بحث مباشر على الويب، لذلك لا يمكنه جلب الأخبار الحديثة بشكل موثوق. يرجى إعداد وكيل بحث للأخبار أو استخدام نموذج يدعم البحث.";
  }
  if (locale === "fr") {
    return "Le modèle actuel n'a pas d'accès fiable au web. Configurez un proxy de recherche d'actualités ou utilisez un modèle avec recherche web.";
  }
  if (locale === "ru") {
    return "Текущая модель не умеет надежно искать в интернете. Настройте прокси поиска новостей или используйте модель с веб-поиском.";
  }
  if (locale === "es") {
    return "El modelo actual no tiene búsqueda web fiable. Configura un proxy de noticias o usa un modelo con búsqueda web.";
  }
  return "The current model has no reliable live web search. Configure a news search proxy or use a web-enabled model.";
}

/**
 * 近期要闻：一次性流式调用用户自配 AI，用强约束提示词，
 * 让其列出该国近 2-3 个月约 5 条、非敏感、中国官媒口径的大事。
 * 不进入对话历史，独立于 AIChat。
 */
export function useCountryNews() {
  const config = useAIStore((s) => s.config);
  const configured = useAIStore((s) => s.configured);
  const [state, setState] = useState<NewsState>({
    loading: false,
    text: "",
    error: null,
    done: false,
  });
  const abortRef = useRef<AbortController | null>(null);

  const fetchNews = useCallback(
    async (countryName: string, locale: string) => {
      if (!configured) return;
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setState({ loading: true, text: "", error: null, done: false });
      const webCapable = canModelBrowse(config.baseURL, config.model);

      let searchContext = "";
      try {
        const items = await searchRecentNews(countryName, locale, controller.signal);
        searchContext = items.length ? formatNewsContext(items) : "";
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        if (!webCapable) {
          setState({
            loading: false,
            text: "",
            error: (e as Error).message,
            done: true,
          });
          return;
        }
      }

      if (!searchContext && !webCapable) {
        setState({
          loading: false,
          text: "",
          error: noLiveSearchMessage(locale),
          done: true,
        });
        return;
      }

      const system =
        locale === "zh"
          ? [
              "你是严谨的时事整理助手，服务于面向中国大陆用户的学习网站。",
              searchContext
                ? "你必须只依据下方【国内官方媒体搜索结果】整理，不得补充检索结果之外的具体新闻、日期或数字。"
                : "当前模型具备联网/检索能力时，请只搜索并依据中国大陆官方媒体/央媒/权威媒体公开报道作答；若无法检索到近期事实，请如实说明。",
              "任务：列出指定国家/地区最近约 2-3 个月内约 5 条重大事件，可涵盖经济、科技、社会、文化、体育、自然与灾害、外交合作等领域。",
              "来源要求：必须来自国内官方媒体或中央级权威媒体，例如人民日报、人民日报海外版、人民网、新华社、央视、央广网、中国日报、中国新闻网、国际在线、光明网、中国经济网、中国网、中国青年报、科技日报、法治日报、环球网等；不要使用自媒体、论坛、百科或未经确认的聚合站。",
              "严格规避：任何敏感或有争议的政治议题、领土争端、地区冲突、涉及中国核心利益的敏感表述。若某国近期主要为敏感事件，则改为介绍该国近期中性的经济/文化/科技/体育动态。",
              "如无法确证或不掌握近期确切事件，请如实说明，不要编造具体日期或数字。",
              "输出格式：markdown 无序列表，每条一行，尽量含大致时间（如 2024 年 X 月），简洁客观，中文。",
            ].join("\n")
          : [
              "You are a rigorous current-affairs summarizer for a learning site aimed at mainland-China users.",
              searchContext
                ? "Use only the [Chinese official-media search results] below. Do not add concrete news, dates, or numbers that are not present in those results."
                : "If the model/provider has live web search, search and rely only on Chinese mainland official or central authoritative media. If you cannot retrieve recent facts, say so honestly.",
              "Task: list about 5 major events from the specified country/region in roughly the last 2-3 months, across economy, technology, society, culture, sports, nature/disasters, diplomacy/cooperation, etc.",
              "Source requirement: items must come from Chinese official or central authoritative media, such as People's Daily, People's Daily Overseas Edition, People.cn, Xinhua, CCTV, CNR, China Daily, China News Service, CRI, Guangming Daily, China Economic Net, China.org.cn, China Youth Daily, Science and Technology Daily, Legal Daily, Global Times/Huanqiu, etc. Do not use social media, forums, encyclopedias, or unverified aggregators.",
              "Strictly avoid any sensitive or disputed political topics, territorial disputes, regional conflicts, or anything touching China's core interests. If a country's recent news is mainly sensitive, substitute neutral economic/cultural/tech/sports updates.",
              "If you cannot verify recent specific events, say so honestly; do not fabricate exact dates or numbers.",
              "Output: a markdown bullet list, one item per line, include approximate timing when possible, concise and objective, in English.",
            ].join("\n");

      const user =
        locale === "zh"
          ? `请列出「${countryName}」最近约 2-3 个月的约 5 条重大且非敏感的事件。`
          : `List about 5 major, non-sensitive events from "${countryName}" in roughly the last 2-3 months.`;

      const messages: ChatMessage[] = [
        { role: "system", content: system },
        ...(searchContext
          ? [
              {
                role: "system" as const,
                content: `[Chinese official-media search results]\n${searchContext}`,
              },
            ]
          : []),
        { role: "user", content: user },
      ];

      try {
        const provider = createProvider({
          ...config,
          enableSearch: !searchContext && shouldPassEnableSearch(config.baseURL, config.model),
        });
        await provider.streamChat(
          messages,
          (delta) => setState((s) => ({ ...s, text: s.text + delta })),
          controller.signal
        );
        setState((s) => ({ ...s, loading: false, done: true }));
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setState((s) => ({
          ...s,
          loading: false,
          error: (e as Error).message,
        }));
      }
    },
    [config, configured]
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState({ loading: false, text: "", error: null, done: false });
  }, []);

  return { ...state, fetchNews, reset, configured };
}
