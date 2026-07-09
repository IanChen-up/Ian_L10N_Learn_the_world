import type { LocalizedText } from "@/types/country";

export interface LangPhrase {
  key: string;
  text: string;
  romanization?: string;
}
export interface LangPhraseEntry {
  langTag: string;
  items: LangPhrase[];
}
export type LangPhrasesMap = Record<string, LangPhraseEntry>;

const t9 = (
  zh: string,
  en: string,
  ja: string,
  ko: string,
  ar: string,
  fr: string,
  ru: string,
  es: string,
  zhHant = zh,
): LocalizedText => ({ zh, "zh-Hant": zhHant, en, ja, ko, ar, fr, ru, es });

/** 常用语 key 的多语言标签（与 ProfileSection 保持一致）。 */
export const PHRASE_LABEL: Record<string, LocalizedText> = {
  hello: t9("你好", "Hello", "こんにちは", "안녕하세요", "مرحبًا", "Bonjour", "Здравствуйте", "Hola", "你好"),
  thanks: t9("谢谢", "Thank you", "ありがとう", "감사합니다", "شكرًا", "Merci", "Спасибо", "Gracias", "謝謝"),
  goodbye: t9("再见", "Goodbye", "さようなら", "안녕히 가세요", "وداعًا", "Au revoir", "До свидания", "Adiós", "再見"),
  yes: t9("是", "Yes", "はい", "예", "نعم", "Oui", "Да", "Sí", "是"),
  no: t9("否", "No", "いいえ", "아니요", "لا", "Non", "Нет", "No", "否"),
  please: t9("请", "Please", "お願いします", "부탁합니다", "من فضلك", "S’il vous plaît", "Пожалуйста", "Por favor", "請"),
  cheers: t9("干杯", "Cheers", "乾杯", "건배", "نخبك", "Santé", "За здоровье", "Salud", "乾杯"),
};

const BASE = import.meta.env.BASE_URL || "/";
let cache: LangPhrasesMap | null = null;
let inflight: Promise<LangPhrasesMap> | null = null;

/** 加载按语言复用的常用语库（key = ISO 639-3）。 */
export async function loadLangPhrases(): Promise<LangPhrasesMap> {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = fetch(`${BASE}data/lang-phrases.json`)
    .then((r) => (r.ok ? r.json() : {}))
    .then((d: LangPhrasesMap) => {
      cache = d || {};
      return cache;
    })
    .catch(() => ({}));
  return inflight;
}
