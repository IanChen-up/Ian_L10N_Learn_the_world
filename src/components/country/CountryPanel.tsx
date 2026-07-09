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
import type { FilterDimension, HolidayInfo } from "@/types/country";

function holidayDate(date: HolidayInfo["date"], locale: string): string {
  if (!date) return "";
  return typeof date === "string" ? localizeDateString(date, locale) : localized(date, locale);
}

function localizeDateString(date: string, locale: string): string {
  if (locale !== "ar") return date;
  const exact: Record<string, string> = {
    "农历正月初一": "اليوم الأول من الشهر القمري الأول",
    "农历正月十五": "اليوم الخامس عشر من الشهر القمري الأول",
    "农历三月初十": "اليوم العاشر من الشهر القمري الثالث",
    "农历四月十五前后": "حوالي اليوم الخامس عشر من الشهر القمري الرابع",
    "农历五月初五": "اليوم الخامس من الشهر القمري الخامس",
    "农历七月十五": "اليوم الخامس عشر من الشهر القمري السابع",
    "农历八月十五": "اليوم الخامس عشر من الشهر القمري الثامن",
    "全年": "على مدار العام",
    "各州不同": "يختلف حسب الولاية",
    "每周日": "كل يوم أحد",
    "斋月结束（移动）": "نهاية رمضان (موعد متغير)",
    "移动（伊斯兰历）": "موعد متغير حسب التقويم الهجري",
    "伊斯兰历斋月结束": "نهاية رمضان حسب التقويم الهجري",
    "伊斯兰历十二月": "الشهر الثاني عشر من التقويم الهجري",
    "复活节次日": "اليوم التالي لعيد الفصح",
    "东正教复活节次日": "اليوم التالي لعيد الفصح الأرثوذكسي",
    "复活节前一周（移动）": "الأسبوع السابق لعيد الفصح (موعد متغير)",
    "大斋期首日（移动）": "اليوم الأول من الصوم الكبير (موعد متغير)",
    "将临期（12月前）": "زمن المجيء، قبل ديسمبر",
    "犹太历提斯利月（秋季）": "شهر تشري حسب التقويم العبري (الخريف)",
    "波斯历正月十三": "اليوم الثالث عشر من الشهر الأول في التقويم الفارسي",
    "诺鲁孜前的周三夜": "ليلة الأربعاء السابقة للنوروز",
  };
  if (exact[date]) return exact[date];

  const month: Record<string, string> = {
    "1": "يناير",
    "2": "فبراير",
    "3": "مارس",
    "4": "أبريل",
    "5": "مايو",
    "6": "يونيو",
    "7": "يوليو",
    "8": "أغسطس",
    "9": "سبتمبر",
    "10": "أكتوبر",
    "11": "نوفمبر",
    "12": "ديسمبر",
  };
  const ordinal: Record<string, string> = {
    一: "الأول",
    二: "الثاني",
    三: "الثالث",
    四: "الرابع",
    五: "الخامس",
  };
  const weekday: Record<string, string> = {
    一: "الاثنين",
    二: "الثلاثاء",
    三: "الأربعاء",
    四: "الخميس",
    五: "الجمعة",
    六: "السبت",
    日: "الأحد",
  };

  let s = date.trim();
  s = s.replace(/^(\d{1,2})\s*月底至\s*(\d{1,2})\s*月初$/, (_, a, b) => `من أواخر ${month[a] || a} إلى أوائل ${month[b] || b}`);
  s = s.replace(/^(\d{1,2})\s*月至\s*(\d{1,2})\s*月初$/, (_, a, b) => `من ${month[a] || a} إلى أوائل ${month[b] || b}`);
  s = s.replace(/^(\d{1,2})\s*月至\s*(\d{1,2})\s*月$/, (_, a, b) => `من ${month[a] || a} إلى ${month[b] || b}`);
  s = s.replace(/^(\d{1,2})月第([一二三四五])个周([一二三四五六日])$/, (_, m, n, d) => `${weekday[d]} ${ordinal[n]} من ${month[m] || m}`);
  s = s.replace(/^(\d{1,2})月(\d{1,2})日前的周([一二三四五六日])$/, (_, m, day, d) => `${weekday[d]} السابق لـ ${day} ${month[m] || m}`);
  s = s.replace(/^(\d{1,2})\s*月或\s*(\d{1,2})\s*月（移动）$/, (_, a, b) => `${month[a] || a} أو ${month[b] || b} (موعد متغير)`);
  s = s.replace(/^(\d{1,2})月或(\d{1,2})月（移动）$/, (_, a, b) => `${month[a] || a} أو ${month[b] || b} (موعد متغير)`);
  s = s.replace(/^(\d{1,2})月中旬$/, (_, m) => `منتصف ${month[m] || m}`);
  s = s.replace(/^(\d{1,2})\s*月$/, (_, m) => month[m] || m);
  s = s.replace(/^(\d{1,2})月$/, (_, m) => month[m] || m);
  s = s.replace(/^(\d{2}-\d{2}) 前后$/, (_, d) => `حوالي ${d}`);

  const replacements: Record<string, string> = {
    "前后": "حوالي",
    "移动": "موعد متغير",
    "伊斯兰历": "التقويم الهجري",
    "斋月结束": "نهاية رمضان",
    "四旬期前": "قبل الصوم الكبير",
    "四旬斋前": "قبل الصوم الكبير",
    "四旬期末": "نهاية الصوم الكبير",
    "复活节后第四个周五": "الجمعة الرابعة بعد عيد الفصح",
    "复活节后14周": "بعد 14 أسبوعًا من عيد الفصح",
    "圣体节": "عيد الجسد",
    "冬末": "نهاية الشتاء",
    "春季": "الربيع",
    "夏季": "الصيف",
    "秋季": "الخريف",
    "双年": "كل سنتين",
    "多数州": "في معظم الولايات",
    "圣卡塔利娜岛": "جزيرة سانتا كاتالينا",
  };
  for (const [from, to] of Object.entries(replacements)) s = s.split(from).join(to);
  s = s.replace(/(\d{1,2})\s*月/g, (_, m) => month[m] || m);
  s = s.replace(/[（）]/g, (ch) => (ch === "（" ? "(" : ")"));

  return /[\u3400-\u9fff]/.test(s) ? "تاريخ تقليدي متغير" : s;
}

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
                            <span className="shrink-0 text-xs text-muted">{holidayDate(h.date, locale)}</span>
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
