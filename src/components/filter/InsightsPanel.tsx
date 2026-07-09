import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Sparkles } from "lucide-react";
import { useExploreStore } from "@/stores/useExploreStore";
import { useLocaleStore } from "@/stores/useLocaleStore";
import { localized } from "@/services/countryData";
import { loadInsights, buildInsightGroups, type InsightGroup, type InsightValue } from "@/services/insights";
import { loadLanguageFamilies } from "@/services/languageFamilies";
import type { LocalizedText } from "@/types/country";

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

export default function InsightsPanel() {
  const { locale } = useLocaleStore();
  const [groups, setGroups] = useState<InsightGroup[]>([]);
  const [openGroup, setOpenGroup] = useState<string | null>("fun");
  const activeFilter = useExploreStore((s) => s.activeFilter);
  const setFilter = useExploreStore((s) => s.setFilter);
  const selectCountry = useExploreStore((s) => s.selectCountry);

  useEffect(() => {
    let alive = true;
    Promise.all([loadInsights(), loadLanguageFamilies()]).then(([ins, fams]) => {
      if (!alive) return;
      const base = ins ? buildInsightGroups(ins) : [];
      // 语系分组：按覆盖国家数降序
      const famItems: InsightValue[] = Object.entries(fams || {})
        .map(([key, e]) => ({
          key: `family.${key}`,
          label: e.label,
          countries: e.countries,
          cssVar: "--dim-language",
          emoji: "🗣️",
        }))
        .sort((a, b) => b.countries.length - a.countries.length);
      const famGroup: InsightGroup | null = famItems.length
        ? {
            key: "language",
            emoji: "🗣️",
            title: t9(
              "语系（语言学）",
              "Language families",
              "語族（言語学）",
              "어족(언어학)",
              "العائلات اللغوية",
              "Familles linguistiques",
              "Языковые семьи",
              "Familias lingüísticas",
              "語系（語言學）",
            ),
            items: famItems,
          }
        : null;
      // 顺序：有趣指标 → 语系 → 历史
      const ordered = famGroup ? [base[0], famGroup, ...base.slice(1)].filter(Boolean) : base;
      setGroups(ordered as InsightGroup[]);
    });
    return () => {
      alive = false;
    };
  }, []);

  const apply = (item: InsightValue) => {
    selectCountry(null);
    setFilter({
      dimension: "insight",
      value: item.key,
      label: localized(item.label, locale),
      countries: new Set(item.countries),
      values: item.values,
      cssVar: item.cssVar,
      unit: item.unit,
      diverging: item.diverging,
      years: item.years,
    });
  };

  if (groups.length === 0) return null;

  return (
    <div className="space-y-1">
      {groups.map((g) => {
        const isOpen = openGroup === g.key;
        return (
          <div key={g.key} className="rounded-xl border border-border/60">
            <button
              onClick={() => setOpenGroup((cur) => (cur === g.key ? null : g.key))}
              className="flex w-full items-center justify-between px-3 py-2.5 text-start"
            >
              <span className="flex items-center gap-2 text-sm font-medium text-primary">
                <span>{g.emoji}</span>
                {localized(g.title, locale)}
              </span>
              <ChevronDown
                size={14}
                className={`text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <ul className="max-h-64 space-y-0.5 overflow-y-auto px-2 pb-2">
                    {g.items.map((item) => {
                      const active =
                        activeFilter?.dimension === "insight" && activeFilter.value === item.key;
                      return (
                        <li key={item.key}>
                          <button
                            onClick={() => apply(item)}
                            className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-start text-sm transition ${
                              active
                                ? "bg-accent/15 font-medium text-primary"
                                : "text-secondary hover:bg-sunken hover:text-primary"
                            }`}
                          >
                            <span className="flex items-center gap-2 truncate">
                              <span className="shrink-0 text-xs">{item.emoji}</span>
                              <span className="truncate">{localized(item.label, locale)}</span>
                            </span>
                            <span className="ms-2 shrink-0 text-xs text-muted">
                              {item.countries.length}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

/** 分类标题（供 FilterPanel 顶部复用图标） */
export function InsightsHeader() {
  const { t } = useTranslation();
  return (
    <span className="flex items-center gap-2 font-display text-sm font-semibold text-primary">
      <Sparkles size={16} className="text-accent" />
      {t("insights.title")}
    </span>
  );
}
