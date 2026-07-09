import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import zh from "@/locales/zh.json";
import en from "@/locales/en.json";
import zhHant from "@/locales/zh-Hant.json";
import ja from "@/locales/ja.json";
import ko from "@/locales/ko.json";
import ar from "@/locales/ar.json";
import fr from "@/locales/fr.json";
import ru from "@/locales/ru.json";
import es from "@/locales/es.json";

/** 支持的界面语言：联合国 6 官方语言 + 日/韩/繁体中文。 */
export type AppLocale = "zh" | "zh-Hant" | "en" | "ar" | "fr" | "ru" | "es" | "ja" | "ko";
export const SUPPORTED_LOCALES: AppLocale[] = [
  "zh",
  "zh-Hant",
  "en",
  "ja",
  "ko",
  "ar",
  "fr",
  "ru",
  "es",
];

/** 语言元信息：母语显示名 + 书写方向。用于切换器与全局 dir 设置。 */
export const LOCALE_META: Record<AppLocale, { label: string; english: string; dir: "ltr" | "rtl" }> = {
  zh: { label: "简体中文", english: "Chinese", dir: "ltr" },
  "zh-Hant": { label: "繁體中文", english: "Traditional Chinese", dir: "ltr" },
  en: { label: "English", english: "English", dir: "ltr" },
  ja: { label: "日本語", english: "Japanese", dir: "ltr" },
  ko: { label: "한국어", english: "Korean", dir: "ltr" },
  ar: { label: "العربية", english: "Arabic", dir: "rtl" },
  fr: { label: "Français", english: "French", dir: "ltr" },
  ru: { label: "Русский", english: "Russian", dir: "ltr" },
  es: { label: "Español", english: "Spanish", dir: "ltr" },
};

export function localeDir(locale: string): "ltr" | "rtl" {
  return LOCALE_META[locale as AppLocale]?.dir ?? "ltr";
}

const resources = {
  zh: { translation: zh },
  "zh-Hant": { translation: zhHant },
  en: { translation: en },
  ja: { translation: ja },
  ko: { translation: ko },
  ar: { translation: ar },
  fr: { translation: fr },
  ru: { translation: ru },
  es: { translation: es },
};

function getInitialLocale(): AppLocale {
  if (typeof window === "undefined") return "zh";
  const saved = localStorage.getItem("atlas-locale") as AppLocale | null;
  if (saved && SUPPORTED_LOCALES.includes(saved)) return saved;
  const nav = navigator.language.toLowerCase();
  // 繁体优先匹配（zh-TW / zh-HK / zh-Hant）
  if (nav.startsWith("zh")) {
    if (nav.includes("hant") || nav.includes("tw") || nav.includes("hk") || nav.includes("mo")) {
      return "zh-Hant";
    }
    return "zh";
  }
  if (nav.startsWith("ja")) return "ja";
  if (nav.startsWith("ko")) return "ko";
  if (nav.startsWith("ar")) return "ar";
  if (nav.startsWith("fr")) return "fr";
  if (nav.startsWith("ru")) return "ru";
  if (nav.startsWith("es")) return "es";
  return "en";
}

const initialLocale = getInitialLocale();

i18n.use(initReactI18next).init({
  resources,
  lng: initialLocale,
  // 回退顺序：繁体→简体→英文；其余→英文。
  fallbackLng: { "zh-Hant": ["zh", "en"], default: ["en"] },
  interpolation: { escapeValue: false },
  returnNull: false,
});

// 首屏即设置文档语言与书写方向（供 CSS 逻辑属性与 RTL 生效）
if (typeof document !== "undefined") {
  document.documentElement.lang = initialLocale;
  document.documentElement.dir = localeDir(initialLocale);
}

export default i18n;
