import { useState, useCallback } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { useTranslation } from "react-i18next";
import { Plus, Minus, Locate } from "lucide-react";
import { getProvinceGeoUrl } from "@/services/subdivisions";
import { localized } from "@/services/countryData";
import type { ProvinceMap } from "@/types/province";

interface TooltipState {
  x: number;
  y: number;
  label: string;
}

export interface SubdivisionMapProps {
  iso: string;
  selectedName: string | null;
  onSelect: (name: string) => void;
  provinces?: ProvinceMap | null;
  locale?: string;
  projection?: string;
  projectionConfig?: Record<string, unknown>;
  initialCenter?: [number, number];
  initialZoom?: number;
}

export default function SubdivisionMap({
  iso,
  selectedName,
  onSelect,
  provinces,
  locale = "zh",
  projection = "geoMercator",
  projectionConfig,
  initialCenter = [0, 0],
  initialZoom = 1,
}: SubdivisionMapProps) {
  const { t } = useTranslation();
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [position, setPosition] = useState({
    coordinates: initialCenter,
    zoom: initialZoom,
  });

  const geoUrl = getProvinceGeoUrl(iso);

  const handleMove = useCallback(
    (pos: { coordinates: [number, number]; zoom: number }) => setPosition(pos),
    [],
  );
  const zoomIn = () => setPosition((p) => ({ ...p, zoom: Math.min(p.zoom * 1.5, 8) }));
  const zoomOut = () => setPosition((p) => ({ ...p, zoom: Math.max(p.zoom / 1.5, 1) }));
  const reset = () => setPosition({ coordinates: initialCenter, zoom: initialZoom });

  return (
    <div className="relative h-full w-full overflow-hidden">
      <ComposableMap
        projection={projection}
        projectionConfig={projectionConfig}
        className="keep-ltr h-full w-full"
        style={{ background: "hsl(var(--map-ocean))", transition: "background 0.5s ease" }}
      >
        <ZoomableGroup
          zoom={position.zoom}
          center={position.coordinates}
          onMoveEnd={handleMove}
          maxZoom={8}
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const name = String(geo.properties.name || "");
                const clickable = Boolean(name && name.trim());
                const isSelected = clickable && name === selectedName;
                const province = provinces?.[name];
                const label = province
                  ? locale === "zh"
                    ? province.name
                    : province.nameEn || localized(province.capital, locale)
                  : name;
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    tabIndex={-1}
                    onMouseEnter={(e) => {
                      if (!clickable) return;
                      setTooltip({ x: e.clientX, y: e.clientY, label });
                    }}
                    onMouseMove={(e) =>
                      setTooltip((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY } : prev))
                    }
                    onMouseLeave={() => setTooltip(null)}
                    onClick={() => clickable && onSelect(name)}
                    style={{
                      default: {
                        fill: isSelected ? "hsl(var(--map-highlight))" : "hsl(var(--map-land))",
                        stroke: "hsl(var(--map-stroke))",
                        strokeWidth: 0.45,
                        outline: "none",
                        transition: "fill 0.25s ease",
                        cursor: clickable ? "pointer" : "default",
                      },
                      hover: {
                        fill: clickable ? "hsl(var(--map-land-hover))" : "hsl(var(--map-land))",
                        stroke: clickable ? "hsl(var(--accent))" : "hsl(var(--map-stroke))",
                        strokeWidth: clickable ? 0.75 : 0.45,
                        outline: "none",
                        cursor: clickable ? "pointer" : "default",
                      },
                      pressed: { fill: "hsl(var(--map-highlight))", outline: "none" },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {tooltip && (
        <div
          className="pointer-events-none fixed z-40 rounded-lg border border-border bg-elevated px-3 py-1.5 text-sm font-medium text-primary shadow-md"
          style={{ left: tooltip.x + 14, top: tooltip.y + 14 }}
        >
          {tooltip.label}
        </div>
      )}

      <div className="absolute bottom-6 end-6 flex flex-col gap-1.5">
        <MapButton onClick={zoomIn} label={t("map.zoomIn")}>
          <Plus size={18} />
        </MapButton>
        <MapButton onClick={zoomOut} label={t("map.zoomOut")}>
          <Minus size={18} />
        </MapButton>
        <MapButton onClick={reset} label={t("map.reset")}>
          <Locate size={18} />
        </MapButton>
      </div>
    </div>
  );
}

function MapButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-glass text-secondary shadow-sm backdrop-blur transition hover:border-accent hover:text-accent hover:shadow-md"
    >
      {children}
    </button>
  );
}
