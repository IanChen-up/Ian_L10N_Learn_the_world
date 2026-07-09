import { localized } from "@/services/countryData";
import type { Province } from "@/types/province";

export function localizedProvinceName(province: Province | undefined, locale: string, fallback = ""): string {
  if (!province) return fallback;
  if (province.nameLocal) return localized(province.nameLocal, locale);
  if (locale === "zh" || locale === "zh-Hant") return province.name;
  return province.nameEn || province.name || fallback;
}

