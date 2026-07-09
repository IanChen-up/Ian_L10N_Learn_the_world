import { create } from "zustand";
import type { AIProvider, AIProviderConfig, ChatMessage } from "@/services/ai/provider";
import { createProvider, createTrialProvider } from "@/services/ai/provider";
import { TRIAL_PROXY_URL, TRIAL_LIMIT } from "@/config/site";

const STORAGE_KEY = "atlas-ai-config";
const TRIAL_KEY = "atlas-ai-trial-used";

function loadTrialUsed(): number {
  if (typeof window === "undefined") return 0;
  const n = Number(localStorage.getItem(TRIAL_KEY) || "0");
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export interface ChatItem {
  id: string;
  role: "user" | "assistant";
  content: string;
}

function loadConfig(): AIProviderConfig {
  if (typeof window === "undefined")
    return { baseURL: "https://api.openai.com/v1", apiKey: "", model: "gpt-4o-mini" };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultConfig(), ...JSON.parse(raw) };
  } catch {
    // ignore
  }
  return defaultConfig();
}

function defaultConfig(): AIProviderConfig {
  return { baseURL: "https://api.openai.com/v1", apiKey: "", model: "gpt-4o-mini" };
}

interface AIState {
  config: AIProviderConfig;
  configured: boolean;
  messages: ChatItem[];
  streaming: boolean;
  selection: string;
  countryContext: string | null;
  abort: AbortController | null;
  /** 剩余试用次数（仅当配置了后端代理时有意义；null 表示未启用试用） */
  trialRemaining: number | null;

  setConfig: (config: AIProviderConfig) => void;
  clearKey: () => void;
  setSelection: (text: string, country?: string | null) => void;
  ask: (text: string, locale: string) => Promise<void>;
  /** 是否可用 AI（自配 Key 或仍有试用额度）——供 AI 搜索等入口判断。 */
  canUseAI: () => boolean;
  /** 供 AI 智能搜索复用：返回可用的 provider 并在成功回调里扣减试用次数。 */
  resolveProvider: () => { provider: AIProvider; onSuccess: () => void } | null;
  stop: () => void;
  clearChat: () => void;
}

const trialEnabled = Boolean(TRIAL_PROXY_URL);

export const useAIStore = create<AIState>((set, get) => ({
  config: loadConfig(),
  configured: Boolean(loadConfig().apiKey),
  messages: [],
  streaming: false,
  selection: "",
  countryContext: null,
  abort: null,
  trialRemaining: trialEnabled ? Math.max(0, TRIAL_LIMIT - loadTrialUsed()) : null,

  setConfig: (config) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    set({ config, configured: Boolean(config.apiKey) });
  },

  clearKey: () => {
    const config = { ...get().config, apiKey: "" };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    set({ config, configured: false });
  },

  setSelection: (text, country) =>
    set({ selection: text, countryContext: country ?? null }),

  ask: async (text, locale) => {
    const { config, messages, selection, countryContext, trialRemaining } = get();
    const hasKey = Boolean(config.apiKey);
    // 无自配 Key 时，若启用了后端试用且仍有次数，则走试用代理
    const useTrial = !hasKey && trialEnabled && (trialRemaining ?? 0) > 0;
    if (!hasKey && !useTrial) {
      // 未配置且无试用额度：由 UI 提示，不发起请求
      return;
    }

    const userMsg: ChatItem = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };
    const assistantMsg: ChatItem = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
    };
    set({ messages: [...messages, userMsg, assistantMsg], streaming: true });

    const systemPrompt =
      locale === "zh"
        ? "你是「Atlas 本地化学习地图」的学习助手，帮助用户理解世界各国的货币、语言、宗教、政体、独特假期与首都等本地化知识。回答简洁、准确、友好，善用类比帮助零基础用户理解。用中文回答。"
        : "You are the study assistant for \"Atlas\", a localization learning map. Help users understand world localization knowledge: currency, language, religion, government, unique holidays and capitals. Answer concisely, accurately and friendly, using analogies to help beginners. Reply in English.";

    const contextParts: string[] = [];
    if (countryContext) contextParts.push(`Current country: ${countryContext}.`);
    if (selection) contextParts.push(`Selected text: "${selection}".`);

    const history: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...(contextParts.length
        ? [{ role: "system" as const, content: contextParts.join(" ") }]
        : []),
      ...get()
        .messages.filter((m) => m.content)
        .map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: text },
    ];

    const controller = new AbortController();
    set({ abort: controller });

    try {
      const provider = useTrial ? createTrialProvider(TRIAL_PROXY_URL) : createProvider(config);
      await provider.streamChat(
        history,
        (delta) => {
          set((state) => ({
            messages: state.messages.map((m) =>
              m.id === assistantMsg.id ? { ...m, content: m.content + delta } : m
            ),
          }));
        },
        controller.signal
      );
      // 试用成功：消耗一次
      if (useTrial) {
        const used = loadTrialUsed() + 1;
        localStorage.setItem(TRIAL_KEY, String(used));
        set({ trialRemaining: Math.max(0, TRIAL_LIMIT - used) });
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        const isExceeded = (e as Error).message === "TRIAL_EXCEEDED";
        if (isExceeded) {
          localStorage.setItem(TRIAL_KEY, String(TRIAL_LIMIT));
          set({ trialRemaining: 0 });
        }
        const errText = isExceeded
          ? locale === "zh"
            ? "🥺 开发者钱包瘪瘪，试用次数已用完啦～请在设置中填入你自己的 API Key 继续使用。"
            : "🥺 The developer's wallet is empty — free trials used up. Please add your own API key in settings to continue."
          : locale === "zh"
          ? `⚠️ 请求出错：${(e as Error).message}`
          : `⚠️ Request error: ${(e as Error).message}`;
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === assistantMsg.id
              ? { ...m, content: m.content || errText }
              : m
          ),
        }));
      }
    } finally {
      set({ streaming: false, abort: null });
    }
  },

  stop: () => {
    get().abort?.abort();
    set({ streaming: false, abort: null });
  },

  clearChat: () => set({ messages: [] }),

  canUseAI: () => {
    const { config, trialRemaining } = get();
    return Boolean(config.apiKey) || (trialEnabled && (trialRemaining ?? 0) > 0);
  },

  resolveProvider: () => {
    const { config, trialRemaining } = get();
    const hasKey = Boolean(config.apiKey);
    if (hasKey) {
      return { provider: createProvider(config), onSuccess: () => {} };
    }
    if (trialEnabled && (trialRemaining ?? 0) > 0) {
      return {
        provider: createTrialProvider(TRIAL_PROXY_URL),
        onSuccess: () => {
          const used = loadTrialUsed() + 1;
          localStorage.setItem(TRIAL_KEY, String(used));
          set({ trialRemaining: Math.max(0, TRIAL_LIMIT - used) });
        },
      };
    }
    return null;
  },
}));
