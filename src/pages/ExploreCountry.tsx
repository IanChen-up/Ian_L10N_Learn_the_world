import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Globe2 } from "lucide-react";
import ChinaMap from "@/components/map/ChinaMap";
import ProvincePanel from "@/components/country/ProvincePanel";
import ThemeToggle from "@/components/common/ThemeToggle";
import LanguageToggle from "@/components/common/LanguageToggle";
import { hasSubdivisions, loadProvinces } from "@/services/subdivisions";
import { getCountryByIso, loadCountries, localized } from "@/services/countryData";
import { useLocaleStore } from "@/stores/useLocaleStore";
import type { ProvinceMap } from "@/types/province";

const MAP_BY_ISO: Record<string, typeof ChinaMap> = {
  CN: ChinaMap,
};

export default function ExploreCountry() {
  const { iso: rawIso } = useParams();
  const iso = (rawIso || "").toUpperCase();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { locale } = useLocaleStore();

  const [provinces, setProvinces] = useState<ProvinceMap | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [, force] = useState(0);

  const country = getCountryByIso(iso);
  const SubMap = MAP_BY_ISO[iso];

  useEffect(() => {
    if (!hasSubdivisions(iso)) {
      navigate("/", { replace: true });
      return;
    }
    let alive = true;
    setStatus("loading");
    Promise.all([loadProvinces(iso), loadCountries()])
      .then(([data]) => {
        if (!alive) return;
        setProvinces(data);
        setStatus("ready");
        force((n) => n + 1);
      })
      .catch(() => alive && setStatus("error"));
    return () => {
      alive = false;
    };
  }, [iso, navigate]);

  const selectedProvince = useMemo(
    () => (selectedName && provinces ? provinces[selectedName] ?? null : null),
    [selectedName, provinces]
  );

  const countryName = country ? localized(country.name, locale) : iso;

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-glass backdrop-blur-md">
        <div className="flex h-16 items-center gap-3 px-4 md:px-6">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-secondary transition hover:border-accent hover:text-accent"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">{t("province.backToWorld")}</span>
          </Link>

          <div className="flex flex-1 items-center gap-2.5">
            <span className="text-2xl leading-none">{country?.flag ?? "🗺️"}</span>
            <div className="leading-tight">
              <h1 className="font-display text-lg font-semibold text-primary">
                {t("province.title", { country: countryName })}
              </h1>
              <p className="hidden text-xs text-muted sm:block">
                {t("province.subtitle")}
              </p>
            </div>
          </div>

          <nav className="flex items-center gap-2">
            <Link
              to="/"
              aria-label={t("nav.explore")}
              title={t("nav.explore")}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-secondary transition hover:border-accent hover:text-accent"
            >
              <Globe2 size={18} />
            </Link>
            <LanguageToggle />
            <ThemeToggle />
          </nav>
        </div>
      </header>

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
        {status === "ready" && SubMap && (
          <>
            <SubMap
              selectedName={selectedName}
              onSelect={(name) => setSelectedName(name || null)}
            />

            {/* Pick hint */}
            {!selectedProvince && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full border border-border bg-glass px-4 py-1.5 text-xs text-muted backdrop-blur"
              >
                {t("province.pickHint")}
              </motion.div>
            )}

            <ProvincePanel
              province={selectedProvince}
              onClose={() => setSelectedName(null)}
            />
          </>
        )}
      </main>
    </div>
  );
}
