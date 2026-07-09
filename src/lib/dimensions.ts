import type { DisplayDimension, FilterDimension } from "@/types/country";

export interface DimensionMeta {
  emoji: string;
  /** tailwind text color class */
  color: string;
  /** css var name for the dimension color */
  cssVar: string;
}

export const DISPLAY_DIMENSION_META: Record<DisplayDimension, DimensionMeta> = {
  capital: { emoji: "🏛️", color: "text-dim-capital", cssVar: "--dim-capital" },
  currency: { emoji: "💰", color: "text-dim-currency", cssVar: "--dim-currency" },
  language: { emoji: "🗣️", color: "text-dim-language", cssVar: "--dim-language" },
  religion: { emoji: "🕌", color: "text-dim-religion", cssVar: "--dim-religion" },
  government: { emoji: "⚖️", color: "text-dim-government", cssVar: "--dim-government" },
  holiday: { emoji: "🎉", color: "text-dim-holiday", cssVar: "--dim-holiday" },
};

/** 可筛选维度用于面板的元信息（region 复用 capital 的翠绿色系） */
export const FILTER_DIMENSION_META: Record<FilterDimension, DimensionMeta> = {
  region: { emoji: "🌍", color: "text-dim-capital", cssVar: "--dim-capital" },
  currency: DISPLAY_DIMENSION_META.currency,
  language: DISPLAY_DIMENSION_META.language,
  religion: DISPLAY_DIMENSION_META.religion,
  government: DISPLAY_DIMENSION_META.government,
};
