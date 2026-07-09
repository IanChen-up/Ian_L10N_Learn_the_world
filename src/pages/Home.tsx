import { useTranslation } from "react-i18next";
import { AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import WorldMap from "@/components/map/WorldMap";
import DrillDownLayer from "@/components/map/DrillDownLayer";
import FilterPanel from "@/components/filter/FilterPanel";
import BrowseResults from "@/components/filter/BrowseResults";
import CountryPanel from "@/components/country/CountryPanel";
import CreatorCredit from "@/components/layout/CreatorCredit";
import { useCountryData } from "@/hooks/useCountryData";
import { useRouteSync } from "@/hooks/useRouteSync";

export default function Home() {
  const { t } = useTranslation();
  const status = useCountryData();
  useRouteSync();

  return (
    <div className="flex h-screen flex-col">
      <Navbar />
      <main className="relative flex-1 overflow-hidden">
        {status === "loading" && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-base">
            <Loader2 className="animate-spin text-accent" size={28} />
            <p className="text-sm text-muted">{t("map.loading")}</p>
          </div>
        )}
        {status === "error" && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-base">
            <p className="text-sm text-muted">⚠️ {t("panel.noData")}</p>
          </div>
        )}
        {status === "ready" && (
          <>
            <WorldMap />
            <FilterPanel />
            <BrowseResults />
            <CountryPanel />
            <CreatorCredit />
            <AnimatePresence>
              <DrillDownLayer />
            </AnimatePresence>
          </>
        )}
      </main>
    </div>
  );
}
