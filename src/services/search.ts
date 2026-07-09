import type { DimensionIndex, FilterDimension } from "@/types/country";
import { getLoadedCountries, localized } from "@/services/countryData";
import type { TFunction } from "i18next";

export type SearchResult =
  | {
      kind: "country";
      iso: string;
      label: string;
      sub: string;
      flag: string;
    }
  | {
      kind: "dimension";
      dimension: FilterDimension;
      value: string;
      label: string;
      sub: string;
      emoji: string;
      count: number;
    };

const DIM_EMOJI: Record<FilterDimension, string> = {
  region: "🌍",
  currency: "💰",
  language: "🗣️",
  religion: "🕌",
  government: "⚖️",
};

function dimValueLabel(
  dimension: FilterDimension,
  value: string,
  entry: DimensionIndex[string],
  locale: string,
  t: TFunction
): string {
  if (entry.label) return localized(entry.label, locale);
  if (dimension === "region") return t(`region.${value}`);
  if (dimension === "religion") return t(`religion.${value}`);
  if (dimension === "government") return t(`government.${value}`);
  return value;
}

export function searchAll(
  query: string,
  indexes: Partial<Record<FilterDimension, DimensionIndex>>,
  locale: string,
  t: TFunction
): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const countryResults: SearchResult[] = getLoadedCountries()
    .filter(
      (c) =>
        c.name.zh.toLowerCase().includes(q) ||
        c.name.en.toLowerCase().includes(q) ||
        c.iso.toLowerCase() === q ||
        localized(c.capital, locale).toLowerCase().includes(q)
    )
    .slice(0, 6)
    .map((c) => ({
      kind: "country" as const,
      iso: c.iso,
      label: localized(c.name, locale),
      sub: localized(c.capital, locale),
      flag: c.flag,
    }));

  const dimResults: SearchResult[] = [];
  const dims = Object.keys(indexes) as FilterDimension[];
  for (const dim of dims) {
    const index = indexes[dim];
    if (!index) continue;
    for (const [value, entry] of Object.entries(index)) {
      const label = dimValueLabel(dim, value, entry, locale, t);
      if (
        label.toLowerCase().includes(q) ||
        value.toLowerCase().includes(q)
      ) {
        dimResults.push({
          kind: "dimension",
          dimension: dim,
          value,
          label,
          sub: t(`dimensions.${dim}`),
          emoji: DIM_EMOJI[dim],
          count: entry.countries.length,
        });
      }
    }
  }
  dimResults.sort((a, b) => (b.kind === "dimension" ? b.count : 0) - (a.kind === "dimension" ? a.count : 0));

  return [...countryResults, ...dimResults.slice(0, 6)];
}
