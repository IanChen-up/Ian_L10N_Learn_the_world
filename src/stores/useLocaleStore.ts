import { create } from "zustand";
import i18n, { type AppLocale, SUPPORTED_LOCALES, localeDir } from "@/i18n";

interface LocaleState {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  toggleLocale: () => void;
}

export const useLocaleStore = create<LocaleState>((set, get) => ({
  locale: i18n.language as AppLocale,
  setLocale: (locale) => {
    i18n.changeLanguage(locale);
    localStorage.setItem("atlas-locale", locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = localeDir(locale);
    set({ locale });
  },
  toggleLocale: () => {
    const idx = SUPPORTED_LOCALES.indexOf(get().locale);
    const next = SUPPORTED_LOCALES[(idx + 1) % SUPPORTED_LOCALES.length];
    get().setLocale(next);
  },
}));
