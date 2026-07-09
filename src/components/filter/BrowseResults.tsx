import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useExploreStore } from "@/stores/useExploreStore";
import { useLocaleStore } from "@/stores/useLocaleStore";
import { localeDir } from "@/i18n";
import { getCountryByIso, localized } from "@/services/countryData";
import type { Country } from "@/types/country";
import MapLegend from "@/components/map/MapLegend";
import FlagIcon from "@/components/common/FlagIcon";

export default function BrowseResults() {
  const { t } = useTranslation();
  const { locale } = useLocaleStore();
  const navigate = useNavigate();
  const activeFilter = useExploreStore((s) => s.activeFilter);
  const selectCountry = useExploreStore((s) => s.selectCountry);
  const selectedIso = useExploreStore((s) => s.selectedIso);
  const setHovered = useExploreStore((s) => s.setHovered);
  const hoveredIso = useExploreStore((s) => s.hoveredIso);

  const countries = useMemo<Country[]>(() => {
    if (!activeFilter) return [];
    const values = activeFilter.values;
    return [...activeFilter.countries]
      .map((iso) => getCountryByIso(iso))
      .filter((c): c is Country => Boolean(c))
      .sort((a, b) => {
        // 有数值的按数值降序，否则按名称
        if (values) return (values[b.iso] ?? 0) - (values[a.iso] ?? 0);
        return localized(a.name, locale).localeCompare(localized(b.name, locale));
      });
  }, [activeFilter, locale]);

  const values = activeFilter?.values ?? null;
  const years = activeFilter?.years ?? null;
  const unit = activeFilter?.unit ? localized(activeFilter.unit, locale) : "";
  const isInsight = activeFilter?.dimension === "insight";
  const enterX = localeDir(locale) === "rtl" ? "-110%" : "110%";
  const isMobile = typeof window !== "undefined" ? window.innerWidth < 640 : false;

  return (
    <AnimatePresence>
      {activeFilter && !selectedIso && (
        <motion.aside
          initial={isMobile ? { y: "110%" } : { x: enterX }}
          animate={isMobile ? { y: 0 } : { x: 0 }}
          exit={isMobile ? { y: "110%" } : { x: enterX }}
          transition={{ type: "spring", damping: 30, stiffness: 280 }}
          className="pointer-events-auto absolute inset-x-2 bottom-2 z-20 flex max-h-[42dvh] flex-col overflow-hidden rounded-2xl border border-border bg-glass pb-[env(safe-area-inset-bottom)] shadow-md backdrop-blur-md sm:inset-x-auto sm:bottom-auto sm:end-3 sm:top-3 sm:max-h-[calc(100%-1.5rem)] sm:w-[min(18rem,calc(100vw-1.5rem))] sm:pb-0 md:end-4 md:top-4"
        >
          <div className="flex justify-center pt-2 sm:hidden">
            <span className="h-1 w-10 rounded-full bg-border-strong/70" />
          </div>
          <div className="flex items-start justify-between gap-2 border-b border-border px-4 py-2.5 sm:py-3">
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-semibold text-primary">
                {isInsight
                  ? activeFilter.label
                  : `${t(`dimensions.${activeFilter.dimension}`)} · ${activeFilter.label}`}
              </p>
              <p className="mt-0.5 text-xs text-muted">
                {t("browse.resultCount", { count: countries.length })}
              </p>
            </div>
            <button
              onClick={() => navigate("/")}
              aria-label={t("dimensions.clear")}
              title={t("dimensions.clear")}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-elevated text-secondary shadow-sm transition hover:border-accent hover:bg-accent hover:text-accent-contrast"
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          </div>

          {isInsight && values && <MapLegend filter={activeFilter} />}

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
            {countries.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted">{t("browse.empty")}</p>
            ) : (
              <ul className="space-y-0.5">
                {countries.map((c) => (
                  <li key={c.iso}>
                    <button
                      onMouseEnter={() => setHovered(c.iso)}
                      onMouseLeave={() => setHovered(null)}
                      onClick={() => selectCountry(c.iso)}
                      className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-start text-sm transition ${
                        hoveredIso === c.iso
                          ? "bg-accent/12 text-primary"
                          : "text-secondary hover:bg-sunken"
                      }`}
                    >
                      <FlagIcon
                        iso={c.iso}
                        emoji={c.flag}
                        name={localized(c.name, locale)}
                        className="h-5 w-7"
                      />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate font-medium">{localized(c.name, locale)}</span>
                        {years && years[c.iso]?.length ? (
                          <span className="truncate text-[11px] text-muted">
                            {years[c.iso].join(" · ")}
                          </span>
                        ) : !values ? (
                          <span className="truncate text-xs text-muted">
                            {localized(c.capital, locale)}
                          </span>
                        ) : null}
                      </span>
                      {values && (
                        <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
                          {values[c.iso] ?? "—"}
                          {unit ? ` ${unit}` : ""}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
