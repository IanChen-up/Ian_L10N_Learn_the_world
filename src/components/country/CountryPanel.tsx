import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, Map, Loader2 } from "lucide-react";
import { useExploreStore } from "@/stores/useExploreStore";
import { useLocaleStore } from "@/stores/useLocaleStore";
import { localeDir } from "@/i18n";
import { getCountryByIso, localized } from "@/services/countryData";
import { hasSubdivisions } from "@/services/subdivisions";
import { useCountryProfile } from "@/hooks/useCountryProfile";
import { useCountryImage } from "@/hooks/useCountryImage";
import DimensionCard from "./DimensionCard";
import OverviewGrid from "./OverviewGrid";
import GeoFactsCard from "./GeoFactsCard";
import LanguageCard from "./LanguageCard";
import ProfileSection from "./ProfileSection";
import RecentNews from "./RecentNews";
import type { FilterDimension } from "@/types/country";

export default function CountryPanel() {
  const { t } = useTranslation();
  const { locale } = useLocaleStore();
  const navigate = useNavigate();
  const selectedIso = useExploreStore((s) => s.selectedIso);
  const selectCountry = useExploreStore((s) => s.selectCountry);
  const setDrillIso = useExploreStore((s) => s.setDrillIso);

  const country = selectedIso ? getCountryByIso(selectedIso) : undefined;
  const { profile, loading: profileLoading } = useCountryProfile(country?.iso);
  const { image } = useCountryImage(country?.name.zh, country?.name.en, locale);
  // RTL 时面板停靠在左侧，应从左侧滑入（-100%）
  const enterX = localeDir(locale) === "rtl" ? "-100%" : "100%";

  const gotoBrowse = (dimension: FilterDimension, value: string) => {
    selectCountry(null);
    navigate(`/browse/${dimension}/${encodeURIComponent(value)}`);
  };

  return (
    <AnimatePresence>
      {country && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => selectCountry(null)}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] md:hidden"
          />
          <motion.aside
            initial={{ x: enterX }}
            animate={{ x: 0 }}
            exit={{ x: enterX }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed end-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-s border-border bg-base shadow-lg"
          >
            {/* Header */}
            <div className="relative border-b border-border p-6 pb-5">
              <button
                onClick={() => selectCountry(null)}
                aria-label={t("panel.close")}
                title={t("panel.close")}
                className="absolute end-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-elevated text-secondary shadow-md transition hover:border-accent hover:bg-accent hover:text-accent-contrast"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
              {image && (
                <a
                  href={image.pageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={t("common.learnMore")}
                  className="mb-4 block overflow-hidden rounded-xl border border-border"
                >
                  <img
                    src={image.src}
                    alt={localized(country.name, locale)}
                    loading="lazy"
                    className="h-40 w-full bg-sunken object-cover"
                  />
                </a>
              )}
              <h2 className="mt-3 flex items-center gap-2.5 font-display text-3xl font-bold text-primary">
                <span className="text-4xl leading-none">{country.flag}</span>
                {localized(country.name, locale)}
              </h2>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                🏛️ {localized(country.capital, locale)}
                <span className="mx-1">·</span>
                🌍 {t(`region.${country.region}`)}
              </p>
              {hasSubdivisions(country.iso) && (
                <button
                  onClick={() => {
                    const iso = country.iso;
                    selectCountry(null);
                    setDrillIso(iso);
                  }}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-contrast transition hover:brightness-105"
                >
                  <Map size={16} />
                  {t("panel.exploreProvinces")}
                </button>
              )}
            </div>

            {/* Cards */}
            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              <OverviewGrid country={country} />

              <GeoFactsCard country={country} />

              <DimensionCard dimension="capital" title={t("panel.capital")} index={0}>
                {localized(country.capital, locale)}
              </DimensionCard>

              <DimensionCard dimension="currency" title={t("panel.currency")} index={1}>
                <button
                  onClick={() => gotoBrowse("currency", country.currency.code)}
                  className="group flex w-full items-center justify-between text-start"
                >
                  <span>
                    <span className="font-semibold">
                      {localized(country.currency.name, locale)}
                    </span>{" "}
                    <span className="text-muted">
                      {country.currency.symbol} · {country.currency.code}
                    </span>
                  </span>
                  <ChevronRight
                    size={16}
                    className="rtl-flip shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-accent"
                  />
                </button>
              </DimensionCard>

              <DimensionCard dimension="language" title={t("panel.languages")} index={2}>
                <LanguageCard country={country} onBrowse={(code) => gotoBrowse("language", code)} />
              </DimensionCard>

              <DimensionCard dimension="religion" title={t("panel.religions")} index={3}>
                {country.religions.length ? (
                  <div className="space-y-1.5">
                    {country.religions.map((r) => (
                      <button
                        key={r.key}
                        onClick={() => gotoBrowse("religion", r.key)}
                        className="group flex w-full items-center justify-between text-start"
                      >
                        <span className="transition group-hover:text-dim-religion">
                          {t(`religion.${r.key}`)}
                        </span>
                        {typeof r.share === "number" && (
                          <span className="text-xs text-muted">
                            {r.share}% {t("panel.share")}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className="text-muted">{t("panel.noData")}</span>
                )}
              </DimensionCard>

              <DimensionCard dimension="government" title={t("panel.government")} index={4}>
                <button
                  onClick={() => gotoBrowse("government", country.government)}
                  className="group flex w-full items-center justify-between text-start"
                >
                  <span className="transition group-hover:text-dim-government">
                    {t(`government.${country.government}`)}
                  </span>
                  <ChevronRight
                    size={16}
                    className="rtl-flip shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-accent"
                  />
                </button>
              </DimensionCard>

              <DimensionCard dimension="holiday" title={t("panel.holidays")} index={5}>
                {country.holidays.length ? (
                  <ul className="space-y-2.5">
                    {country.holidays.map((h, i) => (
                      <li key={i}>
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="font-medium">{localized(h.name, locale)}</span>
                          {h.date && (
                            <span className="shrink-0 text-xs text-muted">{h.date}</span>
                          )}
                        </div>
                        {h.note && (
                          <p className="mt-0.5 text-xs leading-relaxed text-secondary">
                            {localized(h.note, locale)}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-muted">{t("panel.noData")}</span>
                )}
              </DimensionCard>

              {/* 丰富档案（懒加载） */}
              {profile && <ProfileSection profile={profile} />}
              {!profile && profileLoading && (
                <div className="flex items-center justify-center gap-2 py-4 text-xs text-muted">
                  <Loader2 size={14} className="animate-spin" />
                  {t("profile.loading")}
                </div>
              )}

              {/* 近期要闻（AI 按需拉取） */}
              <RecentNews countryName={localized(country.name, locale)} />
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
