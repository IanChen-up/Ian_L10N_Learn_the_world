export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/** 用户在设置中填写、仅存 localStorage 的配置（绝不打包进构建产物） */
export interface AIProviderConfig {
  baseURL: string;
  apiKey: string;
  model: string;
  /** 仅供特定请求使用：部分 OpenAI 兼容平台支持额外联网搜索开关。 */
  enableSearch?: boolean;
}

export interface AIProvider {
  streamChat(
    messages: ChatMessage[],
    onToken: (delta: string) => void,
    signal?: AbortSignal
  ): Promise<void>;
}

/**
 * OpenAI 兼容适配器：浏览器端直连用户自填端点，解析 SSE 流。
 * 密钥来自用户本地配置，绝不硬编码。
 */
export class OpenAICompatibleProvider implements AIProvider {
  constructor(private config: AIProviderConfig) {}

  async streamChat(
    messages: ChatMessage[],
    onToken: (delta: string) => void,
    signal?: AbortSignal
  ): Promise<void> {
    const base = this.config.baseURL.replace(/\/+$/, "");
    const url = `${base}/chat/completions`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        stream: true,
        temperature: 0.6,
        ...(this.config.enableSearch ? { enable_search: true } : {}),
      }),
      signal,
    });

    if (!res.ok || !res.body) {
      const text = await res.text().catch(() => "");
      throw new Error(`AI request failed (${res.status}): ${text.slice(0, 200)}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data:")) continue;
        const data = trimmed.slice(5).trim();
        if (data === "[DONE]") return;
        try {
          const json = JSON.parse(data);
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) onToken(delta);
        } catch {
          // 忽略无法解析的心跳/分片
        }
      }
    }
  }
}

export function createProvider(config: AIProviderConfig): AIProvider {
  return new OpenAICompatibleProvider(config);
}

/**
 * 试用适配器：POST 到后端代理（TRIAL_PROXY_URL），由代理持有真实密钥并做限流。
 * 代理需返回 OpenAI 兼容的 SSE 流；浏览器永远拿不到密钥。
 * 约定：HTTP 429 表示已超出试用次数。
 */
export class TrialProvider implements AIProvider {
  constructor(private endpoint: string) {}

  async streamChat(
    messages: ChatMessage[],
    onToken: (delta: string) => void,
    signal?: AbortSignal
  ): Promise<void> {
    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
      signal,
    });

    if (res.status === 429) {
      throw new Error("TRIAL_EXCEEDED");
    }
    if (!res.ok || !res.body) {
      const text = await res.text().catch(() => "");
      throw new Error(`Trial request failed (${res.status}): ${text.slice(0, 200)}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data:")) continue;
        const data = trimmed.slice(5).trim();
        if (data === "[DONE]") return;
        try {
          const json = JSON.parse(data);
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) onToken(delta);
        } catch {
          // 忽略心跳/分片
        }
      }
    }
  }
}

export function createTrialProvider(endpoint: string): AIProvider {
  return new TrialProvider(endpoint);
}
