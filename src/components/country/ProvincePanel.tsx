import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { X, Users, TrendingUp, Ruler, ArrowRight } from "lucide-react";
import { useLocaleStore } from "@/stores/useLocaleStore";
import { localeDir } from "@/i18n";
import { localized } from "@/services/countryData";
import { formatPopulation, formatArea, formatGdpCNY } from "@/lib/format";
import type { Province } from "@/types/province";
import { formatGDP } from "@/lib/format";
import ProvinceGdpHistoryModal from "./ProvinceGdpHistoryModal";

interface ProvincePanelProps {
  province: Province | null;
  onClose: () => void;
}

export default function ProvincePanel({ province, onClose }: ProvincePanelProps) {
  const { t } = useTranslation();
  const { locale } = useLocaleStore();
  const enterX = localeDir(locale) === "rtl" ? "-100%" : "100%";
  const [gdpOpen, setGdpOpen] = useState(false);

  const provinceName = province
    ? locale === "zh"
      ? province.name
      : province.nameEn || province.name
    : "";
  const gdpValue = province?.gdpUSD != null
    ? formatGDP(province.gdpUSD, locale)
    : formatGdpCNY(province?.gdpCNY, locale);
  const gdpCurrency: "USD" | "CNY" = province?.gdpUSD != null ? "USD" : "CNY";

  return (
    <AnimatePresence>
      {province && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] md:hidden"
          />
          <motion.aside
            initial={{ x: enterX }}
            animate={{ x: 0 }}
            exit={{ x: enterX }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed end-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-s border-border bg-base shadow-lg"
          >
            <div className="relative border-b border-border p-6 pb-5">
              <button
                onClick={onClose}
                aria-label={t("panel.close")}
                className="absolute end-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-sunken hover:text-primary"
              >
                <X size={18} />
              </button>
              <div className="flex items-center gap-2">
                {province.abbr && (
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 font-display text-lg font-bold text-accent">
                    {province.abbr}
                  </span>
                )}
                <div>
                  <h2 className="font-display text-2xl font-bold text-primary">
                    {provinceName}
                  </h2>
                  <p className="text-sm text-muted">
                    🏛️ {localized(province.capital, locale)}
                    {province.capitalNote && localized(province.capitalNote, locale)
                      ? ` · ${localized(province.capitalNote, locale)}`
                      : ""}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              {/* Overview stats */}
              <div className="grid grid-cols-3 gap-2">
                <StatCell
                  icon={<Users size={14} />}
                  label={t("panel.population")}
                  value={formatPopulation(province.population ?? null, locale)}
                />
                <StatCell
                  icon={<TrendingUp size={14} />}
                  label={province.gdpYear ? `${t("panel.gdp")} · ${province.gdpYear}` : t("panel.gdp")}
                  value={gdpValue}
                  onClick={province.gdpHistoryKey ? () => setGdpOpen(true) : undefined}
                />
                <StatCell
                  icon={<Ruler size={14} />}
                  label={t("panel.area")}
                  value={province.areaKm2 ? formatArea(province.areaKm2, locale) : "—"}
                />
              </div>

              {province.gdpSource && (
                <div className="rounded-xl border border-border bg-elevated/50 px-3 py-2 text-[11px] leading-relaxed text-muted">
                  {localized(province.gdpSource.label, locale)}
                </div>
              )}

              {/* Dialects */}
              <ProvinceCard emoji="🗣️" cssVar="--dim-language" title={t("province.dialects")}>
                {province.dialects.length ? (
                  <div className="space-y-2">
                    {province.dialects.map((d, i) => (
                      <div key={i} className="flex items-baseline justify-between gap-2">
                        <span className="font-medium">{localized(d.name, locale)}</span>
                        <span className="shrink-0 text-xs text-muted">
                          {localized(d.family, locale)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-muted">{t("panel.noData")}</span>
                )}
              </ProvinceCard>

              {/* Ethnic groups */}
              <ProvinceCard emoji="👥" cssVar="--dim-government" title={t("province.ethnicGroups")}>
                <div className="flex flex-wrap gap-2">
                  {province.ethnicGroups.map((e, i) => (
                    <span
                      key={i}
                      className="rounded-full border border-border px-2.5 py-1 text-xs"
                    >
                      {localized(e.name, locale)}
                      {typeof e.share === "number" ? ` ${e.share}%` : ""}
                    </span>
                  ))}
                </div>
              </ProvinceCard>

              {/* Religions */}
              {province.religions.length > 0 && (
                <ProvinceCard emoji="🕌" cssVar="--dim-religion" title={t("panel.religions")}>
                  <div className="flex flex-wrap gap-2">
                    {province.religions.map((r) => (
                      <span
                        key={r}
                        className="rounded-full border border-border px-2.5 py-1 text-xs"
                      >
                        {t(`religion.${r}`, { defaultValue: r })}
                      </span>
                    ))}
                  </div>
                </ProvinceCard>
              )}

              {/* Highlights */}
              <ProvinceCard emoji="✨" cssVar="--dim-holiday" title={t("province.highlights")}>
                <ul className="space-y-2.5">
                  {province.highlights.map((h, i) => (
                    <li key={i}>
                      <span className="font-medium">{localized(h.name, locale)}</span>
                      {h.note && (
                        <p className="mt-0.5 text-xs leading-relaxed text-secondary">
                          {localized(h.note, locale)}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </ProvinceCard>
            </div>
          </motion.aside>
          {gdpOpen && province.gdpHistoryKey && (
            <ProvinceGdpHistoryModal
              historyKey={province.gdpHistoryKey}
              name={provinceName}
              currency={gdpCurrency}
              source={province.gdpSource}
              onClose={() => setGdpOpen(false)}
            />
          )}
        </>
      )}
    </AnimatePresence>
  );
}

function StatCell({
  icon,
  label,
  value,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onClick?: () => void;
}) {
  const content = (
    <>
      <div className="flex items-center gap-1 text-muted">
        {icon}
        <span className="text-[10px] font-medium">{label}</span>
      </div>
      <div className="mt-1 flex items-center justify-between gap-1 text-xs font-semibold text-primary">
        {value}
        {onClick && <ArrowRight size={12} className="rtl-flip text-accent" />}
      </div>
    </>
  );
  return onClick ? (
    <button
      onClick={onClick}
      title={label}
      className="rounded-xl border border-border bg-elevated/60 px-2.5 py-2 text-start transition hover:border-accent hover:shadow-sm"
    >
      {content}
    </button>
  ) : (
    <div className="rounded-xl border border-border bg-elevated/60 px-2.5 py-2">
      {content}
    </div>
  );
}

function ProvinceCard({
  emoji,
  cssVar,
  title,
  children,
}: {
  emoji: string;
  cssVar: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-2xl border border-border bg-elevated/60 p-4"
      style={{ borderInlineStartColor: `hsl(var(${cssVar}))`, borderInlineStartWidth: 3 }}
    >
      <div className="mb-2.5 flex items-center gap-2">
        <span className="text-lg leading-none">{emoji}</span>
        <h3
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: `hsl(var(${cssVar}))` }}
        >
          {title}
        </h3>
      </div>
      <div className="text-sm text-primary">{children}</div>
    </section>
  );
}
