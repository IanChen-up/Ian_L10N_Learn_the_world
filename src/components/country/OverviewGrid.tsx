import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Users, TrendingUp, Ruler, Phone, Globe, MapPin, Plane, Wifi, Scale, HeartPulse, Building2, ArrowRight } from "lucide-react";
import type { Country } from "@/types/country";
import { useLocaleStore } from "@/stores/useLocaleStore";
import { localized } from "@/services/countryData";
import { formatPopulation, formatGDP, formatArea, formatLatLng } from "@/lib/format";
import GdpHistoryModal from "./GdpHistoryModal";

interface Stat {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  show: boolean;
  onClick?: () => void;
}

export default function OverviewGrid({ country }: { country: Country }) {
  const { t } = useTranslation();
  const { locale } = useLocaleStore();
  const [gdpOpen, setGdpOpen] = useState(false);

  const rankText = (rank?: number) => (rank ? t("panel.globalRank", { rank }) : undefined);

  const stats: Stat[] = [
    {
      icon: <Users size={15} />,
      label: t("panel.population"),
      value: formatPopulation(country.population, locale),
      sub: rankText(country.populationRank),
      show: country.population != null,
    },
    {
      icon: <TrendingUp size={15} />,
      label: country.gdpYear ? `${t("panel.gdp")} · ${country.gdpYear}` : t("panel.gdp"),
      value: formatGDP(country.gdp, locale),
      sub: rankText(country.gdpRank),
      show: country.gdp != null,
      onClick: () => setGdpOpen(true),
    },
    {
      icon: <Ruler size={15} />,
      label: t("panel.area"),
      value: formatArea(country.area, locale),
      sub: rankText(country.areaRank),
      show: country.area > 0,
    },
    {
      icon: <MapPin size={15} />,
      label: t("profile.coordinates"),
      value: formatLatLng(country.latlng, locale),
      show: Boolean(country.latlng && country.latlng.length === 2),
    },
    {
      icon: <Phone size={15} />,
      label: t("panel.callingCode"),
      value: country.callingCode || "—",
      show: Boolean(country.callingCode),
    },
    {
      icon: <Globe size={15} />,
      label: t("panel.tld"),
      value: country.tld || "—",
      show: Boolean(country.tld),
    },
    {
      icon: <Plane size={15} />,
      label: t("panel.visaFree"),
      value: country.visaFree != null ? `${country.visaFree}` : "—",
      sub: t("panel.visaFreeSub"),
      show: country.visaFree != null,
    },
    {
      icon: <Wifi size={15} />,
      label: t("panel.internet"),
      value: country.internetPct != null ? `${country.internetPct}%` : "—",
      show: country.internetPct != null,
    },
    {
      icon: <Scale size={15} />,
      label: t("panel.sexRatio"),
      value: country.sexRatio != null ? `${country.sexRatio}` : "—",
      sub: country.sexRatio != null
        ? country.sexRatio >= 100
          ? t("panel.sexRatioMore", { side: t("panel.male") })
          : t("panel.sexRatioMore", { side: t("panel.female") })
        : t("panel.sexRatioSub"),
      show: country.sexRatio != null,
    },
    {
      icon: <HeartPulse size={15} />,
      label: t("panel.lifeExpectancy"),
      value: country.lifeExpectancy != null ? t("panel.years", { n: country.lifeExpectancy }) : "—",
      show: country.lifeExpectancy != null,
    },
    {
      icon: <Building2 size={15} />,
      label: t("panel.density"),
      value: country.density != null ? `${country.density}` : "—",
      sub: t("panel.densitySub"),
      show: country.density != null,
    },
  ].filter((s) => s.show);

  if (!stats.length) return null;

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        {stats.map((s) => {
          const inner = (
            <>
              <div className="flex items-center gap-1.5 text-muted">
                {s.icon}
                <span className="text-[11px] font-medium">{s.label}</span>
              </div>
              <div className="mt-1 text-sm font-semibold text-primary">{s.value}</div>
              {s.sub && <div className="text-[10px] text-muted">{s.sub}</div>}
            </>
          );
          return s.onClick ? (
            <button
              key={s.label}
              onClick={s.onClick}
              className="rounded-xl border border-border bg-elevated/60 px-3 py-2.5 text-start transition hover:border-accent hover:shadow-sm"
              title={t("gdpChart.open")}
            >
              {inner}
              <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-accent">
                {t("gdpChart.open")}
                <ArrowRight size={10} className="rtl-flip" />
              </span>
            </button>
          ) : (
            <div
              key={s.label}
              className="rounded-xl border border-border bg-elevated/60 px-3 py-2.5"
            >
              {inner}
            </div>
          );
        })}
      </div>
      {gdpOpen && (
        <GdpHistoryModal
          iso={country.iso}
          countryName={localized(country.name, locale)}
          onClose={() => setGdpOpen(false)}
        />
      )}
    </>
  );
}
