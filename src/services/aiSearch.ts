import type { AIProvider, ChatMessage } from "@/services/ai/provider";
import { getLoadedCountries, localized } from "@/services/countryData";

export interface AISearchResult {
  /** 命中的国家 iso2（可能为空，表示 AI 未能定位到具体国家） */
  iso: string | null;
  /** AI 给出的一句话解答（用于展示在搜索结果里） */
  answer: string;
}

/**
 * 用 AI 把自然语言问题解析成"目标国家 + 一句话解答"。
 * 例："莫桑比克讲什么语言" → { iso: "MZ", answer: "莫桑比克的官方语言是葡萄牙语…" }
 *
 * 关键约束：为保证能精确联动地图，要求模型在回答末尾用固定标记输出 ISO alpha-2 代码，
 * 我们再据此在本地数据中校验。若校验失败则按国名兜底匹配。
 */
export async function aiResolveCountry(
  question: string,
  provider: AIProvider,
  locale: string,
  signal?: AbortSignal
): Promise<AISearchResult> {
  const sys =
    locale === "zh"
      ? "你是地理与本地化知识助手。用户会用自然语言提问。请：1) 判断问题主要涉及哪个国家；2) 用一到两句话简洁回答问题本身（中文）。最后另起一行，严格输出该国的 ISO 3166-1 alpha-2 两位大写代码，格式必须为 `ISO=XX`（例如中国是 `ISO=CN`）。若问题不涉及任何具体国家，则输出 `ISO=NONE`。不要输出多余内容。"
      : "You are a geography & localization assistant. The user asks in natural language. 1) Decide which single country the question is mainly about; 2) Answer the question itself in one or two concise sentences (English). Then on a new line, strictly output that country's ISO 3166-1 alpha-2 uppercase code as `ISO=XX` (e.g. China is `ISO=CN`). If no specific country applies, output `ISO=NONE`. No extra content.";

  const messages: ChatMessage[] = [
    { role: "system", content: sys },
    { role: "user", content: question },
  ];

  let raw = "";
  await provider.streamChat(messages, (d) => (raw += d), signal);

  // 解析 ISO=XX
  const m = raw.match(/ISO\s*=\s*([A-Za-z]{2}|NONE)/);
  const code = m ? m[1].toUpperCase() : null;
  const answer = raw.replace(/\n?\s*ISO\s*=\s*([A-Za-z]{2}|NONE)\s*$/i, "").trim();

  let iso: string | null = null;
  if (code && code !== "NONE") {
    const hit = getLoadedCountries().find((c) => c.iso === code);
    if (hit) iso = hit.iso;
  }
  // 兜底：从答案里按国名匹配
  if (!iso) iso = matchByName(answer || question, locale);

  return { iso, answer: answer || raw.trim() };
}

/** 无 AI 或解析失败时的兜底：从文本里找出现的国家名。 */
export function matchByName(text: string, locale: string): string | null {
  const q = text.toLowerCase();
  let best: { iso: string; len: number } | null = null;
  for (const c of getLoadedCountries()) {
    const names = [c.name.zh, c.name.en, localized(c.name, locale)];
    for (const n of names) {
      if (n && q.includes(n.toLowerCase())) {
        if (!best || n.length > best.len) best = { iso: c.iso, len: n.length };
      }
    }
  }
  return best?.iso ?? null;
}
