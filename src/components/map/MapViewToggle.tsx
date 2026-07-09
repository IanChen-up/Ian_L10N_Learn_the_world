import { useTranslation } from "react-i18next";
import { Map, Globe, Mountain, MapPin } from "lucide-react";
import { useExploreStore, type MapView } from "@/stores/useExploreStore";

const VIEWS: { key: MapView; icon: React.ReactNode; labelKey: string }[] = [
  { key: "flat", icon: <Map size={16} />, labelKey: "map.viewFlat" },
  { key: "globe", icon: <Globe size={16} />, labelKey: "map.viewGlobe" },
  { key: "terrain", icon: <Mountain size={16} />, labelKey: "map.viewTerrain" },
];

export default function MapViewToggle() {
  const { t } = useTranslation();
  const mapView = useExploreStore((s) => s.mapView);
  const setMapView = useExploreStore((s) => s.setMapView);
  const showAdmin = useExploreStore((s) => s.showAdmin);
  const toggleAdmin = useExploreStore((s) => s.toggleAdmin);

  return (
    <div className="absolute end-6 top-4 z-20 flex items-center gap-1.5">
      <div className="flex items-center gap-0.5 rounded-xl border border-border bg-glass p-1 shadow-sm backdrop-blur">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            onClick={() => setMapView(v.key)}
            title={t(v.labelKey)}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
              mapView === v.key
                ? "bg-accent text-accent-contrast"
                : "text-secondary hover:text-accent"
            }`}
          >
            {v.icon}
            <span className="hidden sm:inline">{t(v.labelKey)}</span>
          </button>
        ))}
      </div>
      {/* 二级行政区（省会/首府）显示开关 */}
      <button
        onClick={toggleAdmin}
        title={t("map.toggleAdmin")}
        className={`flex items-center gap-1.5 rounded-xl border border-border p-1 px-2.5 py-2 text-xs font-medium shadow-sm backdrop-blur transition ${
          showAdmin
            ? "border-accent bg-accent text-accent-contrast"
            : "bg-glass text-secondary hover:text-accent"
        }`}
      >
        <MapPin size={16} />
        <span className="hidden md:inline">{t("map.adminCapitals")}</span>
      </button>
    </div>
  );
}
