import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import ChinaMap from "@/components/map/ChinaMap";
import SubdivisionMap from "@/components/map/SubdivisionMap";
import ProvincePanel from "@/components/country/ProvincePanel";
import { useExploreStore } from "@/stores/useExploreStore";
import { useLocaleStore } from "@/stores/useLocaleStore";
import { hasSubdivisions, loadProvinces } from "@/services/subdivisions";
import { getCountryByIso, localized } from "@/services/countryData";
import type { ProvinceMap } from "@/types/province";
import FlagIcon from "@/components/common/FlagIcon";

const MAP_BY_ISO: Record<string, ComponentType<{
  selectedName: string | null;
  onSelect: (name: string) => void;
  provinces?: ProvinceMap | null;
  locale?: string;
}>> = {
  CN: ChinaMap,
  US: (props) => (
    <SubdivisionMap
      {...props}
      iso="US"
      projection="geoAlbersUsa"
      initialCenter={[0, 0]}
      initialZoom={1}
    />
  ),
};

/**
 * 就地下钻层：覆盖在世界地图之上，放大到某国省级地图，
 * 不跳转独立路由。通过 store.drillIso 控制显隐。
 */
export default function DrillDownLayer() {
  const { t } = useTranslation();
  const { locale } = useLocaleStore();
  const drillIso = useExploreStore((s) => s.drillIso);
  const setDrillIso = useExploreStore((s) => s.setDrillIso);

  const [provinces, setProvinces] = useState<ProvinceMap | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [selectedName, setSelectedName] = useState<string | null>(null);

  const iso = drillIso || "";
  const country = iso ? getCountryByIso(iso) : undefined;
  const SubMap = MAP_BY_ISO[iso];

  useEffect(() => {
    if (!drillIso || !hasSubdivisions(drillIso)) return;
    let alive = true;
    setStatus("loading");
    setSelectedName(null);
    loadProvinces(drillIso)
      .then((data) => {
        if (!alive) return;
        setProvinces(data);
        setStatus("ready");
      })
      .catch(() => alive && setStatus("error"));
    return () => {
      alive = false;
    };
  }, [drillIso]);

  const selectedProvince = useMemo(
    () => (selectedName && provinces ? provinces[selectedName] ?? null : null),
    [selectedName, provinces]
  );

  if (!drillIso) return null;
  const countryName = country ? localized(country.name, locale) : iso;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.04 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="absolute inset-0 z-30 bg-base"
    >
      {/* Sub header */}
      <div className="absolute inset-x-0 top-0 z-10 flex items-center gap-2 border-b border-border bg-glass px-2.5 py-2 backdrop-blur-md sm:gap-3 sm:px-4 sm:py-3">
        <button
          onClick={() => setDrillIso(null)}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-border px-2 text-sm text-secondary transition hover:border-accent hover:text-accent sm:gap-2 sm:px-3"
        >
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">{t("province.backToWorld")}</span>
        </button>
        <div className="flex min-w-0 items-center gap-2">
          {country ? (
            <FlagIcon
              iso={country.iso}
              emoji={country.flag}
              name={countryName}
              className="h-5 w-7"
            />
          ) : (
            <span className="text-xl leading-none">🗺️</span>
          )}
          <div className="leading-tight">
            <h2 className="truncate font-display text-sm font-semibold text-primary sm:text-base">
              {t("province.title", { country: countryName })}
            </h2>
            <p className="hidden text-xs text-muted sm:block">{t("province.subtitle")}</p>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 top-[50px] sm:top-[57px]">
        {status === "loading" && (
          <div className="flex h-full items-center justify-center gap-2 text-sm text-muted">
            <Loader2 className="animate-spin text-accent" size={22} />
            {t("map.loading")}
          </div>
        )}
        {status === "error" && (
          <div className="flex h-full items-center justify-center text-sm text-muted">
            ⚠️ {t("panel.noData")}
          </div>
        )}
        {status === "ready" && SubMap && (
          <>
            <SubMap
              selectedName={selectedName}
              onSelect={(name) => setSelectedName(name || null)}
              provinces={provinces}
              locale={locale}
            />
            {!selectedProvince && (
              <div className="pointer-events-none absolute bottom-4 left-1/2 hidden -translate-x-1/2 rounded-full border border-border bg-glass px-4 py-1.5 text-xs text-muted backdrop-blur sm:block">
                {t("province.pickHint")}
              </div>
            )}
            <ProvincePanel
              province={selectedProvince}
              onClose={() => setSelectedName(null)}
            />
          </>
        )}
      </div>
    </motion.div>
  );
}
