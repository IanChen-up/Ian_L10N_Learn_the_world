import { useState, useCallback, useRef, useEffect } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
  Graticule,
  Sphere,
} from "react-simple-maps";
import { useTranslation } from "react-i18next";
import { Plus, Minus, Locate } from "lucide-react";
import { useExploreStore } from "@/stores/useExploreStore";
import { useLocaleStore } from "@/stores/useLocaleStore";
import { getCountryByGeoId, getCountryByIso, localized } from "@/services/countryData";
import type { Country } from "@/types/country";
import { cn } from "@/lib/utils";
import IslandMarkers from "./IslandMarkers";
import FilterLabels from "./FilterLabels";
import PolarMarkers from "./PolarMarkers";
import AdminCapitalSvgMarkers from "./AdminCapitalSvgMarkers";
import MapViewToggle from "./MapViewToggle";
import TerrainMap from "./TerrainMap";
import { buildScale, fillForValue } from "@/lib/insightColor";
import FlagIcon from "@/components/common/FlagIcon";

const GEO_URL = `${import.meta.env.BASE_URL || "/"}data/world-atlas.json`;

interface TooltipState {
  x: number;
  y: number;
  label: string;
  flag: string;
  iso?: string;
}

// 以约 150°E 为中心：亚太居中，美洲完整显示在右侧，大洋洲在下方。
const CENTER_ROTATE: [number, number, number] = [-150, 0, 0];

/** 依国土面积估算合适的聚焦缩放级别：小国放得更大，方便看清。 */
function zoomForArea(area: number): number {
  if (!area || area <= 0) return 4;
  if (area < 1000) return 8; // 微型岛国/城邦
  if (area < 25000) return 6;
  if (area < 150000) return 5;
  if (area < 800000) return 4;
  if (area < 3000000) return 3;
  return 2.2; // 巨型国家
}

export default function WorldMap() {
  const { t } = useTranslation();
  const { locale } = useLocaleStore();
  const selectedIso = useExploreStore((s) => s.selectedIso);
  const hoveredIso = useExploreStore((s) => s.hoveredIso);
  const activeFilter = useExploreStore((s) => s.activeFilter);
  const selectCountry = useExploreStore((s) => s.selectCountry);
  const setHovered = useExploreStore((s) => s.setHovered);
  const mapView = useExploreStore((s) => s.mapView);
  const showAdmin = useExploreStore((s) => s.showAdmin);

  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [position, setPosition] = useState({ coordinates: [0, 0] as [number, number], zoom: 1 });
  // 3D 地球旋转角
  const [rotation, setRotation] = useState<[number, number, number]>([-150, -10, 0]);
  const dragRef = useRef<{ x: number; y: number; r0: number; r1: number } | null>(null);

  const highlightSet = activeFilter?.countries ?? null;
  const isGlobe = mapView === "globe";
  const isTerrain = mapView === "terrain";
  // insight 维度的每国数值与配色（用于渐变加深显示）
  const insightValues = activeFilter?.values ?? null;
  const insightCssVar = activeFilter?.cssVar ?? null;
  const insightDiverging = activeFilter?.diverging ?? null;
  const insightScale = buildScale(insightValues, insightDiverging);

  const handleMove = useCallback((pos: { coordinates: [number, number]; zoom: number }) => {
    setPosition(pos);
  }, []);

  const zoomIn = () => setPosition((p) => ({ ...p, zoom: Math.min(p.zoom * 1.5, 8) }));
  const zoomOut = () => setPosition((p) => ({ ...p, zoom: Math.max(p.zoom / 1.5, 1) }));
  const reset = () => {
    setPosition({ coordinates: [0, 0], zoom: 1 });
    setRotation([-150, -10, 0]);
  };

  // 选中单个国家时，自动平滑缩放定位到该国（尤其小国也能看清）
  useEffect(() => {
    if (!selectedIso) return;
    const c = getCountryByIso(selectedIso);
    if (!c?.latlng || c.latlng.length !== 2) return;
    const [lat, lng] = c.latlng;
    if (isGlobe) {
      // 3D 地球：转动使该国朝向正面
      setRotation([-lng, -lat, 0]);
    } else {
      // 平面：以该国为中心并按面积缩放
      setPosition({ coordinates: [lng, lat], zoom: zoomForArea(c.area) });
    }
  }, [selectedIso, isGlobe]);

  const enterCountry = (c: Country, x: number, y: number) => {
    setHovered(c.iso);
    setTooltip({ x, y, label: localized(c.name, locale), flag: c.flag, iso: c.iso });
  };
  const leave = () => {
    setHovered(null);
    setTooltip(null);
  };

  // 科考站等纯文本标注的浮层
  const enterTip = (label: string, x: number, y: number) =>
    setTooltip({ x, y, label, flag: "" });
  const leaveTip = () => setTooltip(null);

  // 地球拖拽旋转
  const onPointerDown = (e: React.PointerEvent) => {
    if (!isGlobe) return;
    dragRef.current = { x: e.clientX, y: e.clientY, r0: rotation[0], r1: rotation[1] };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!isGlobe || !dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    const k = 0.35;
    const nextLat = Math.max(-90, Math.min(90, dragRef.current.r1 - dy * k));
    setRotation([dragRef.current.r0 + dx * k, nextLat, 0]);
  };
  const onPointerUp = () => {
    dragRef.current = null;
  };

  const geoStyle = (country: Country | undefined) => {
    const iso = country?.iso;
    const isSelected = iso && iso === selectedIso;
    // 选中某国时，抑制筛选高亮/暗化，避免地图上出现两处加深（只突出选中国）
    const applyFilter = Boolean(highlightSet) && !selectedIso;
    const isDimmed = applyFilter && iso ? !highlightSet!.has(iso) : false;
    const isHighlighted = applyFilter && iso ? highlightSet!.has(iso) : false;
    const landColor = isTerrain ? "hsl(var(--map-terrain-land, 92 30% 62%))" : "hsl(var(--map-land))";
    // 渐变加深：insight 数值型维度按 min-max 归一化映射透明度；发散型（男女比例）按中点分色
    let highlightFill = "hsl(var(--accent) / 0.85)";
    if (isHighlighted && insightValues && insightScale && iso) {
      const v = insightValues[iso];
      const varName = insightCssVar || "--accent";
      highlightFill = fillForValue(v, insightScale, varName, insightDiverging);
    } else if (isHighlighted && insightCssVar) {
      highlightFill = `hsl(var(${insightCssVar}) / 0.8)`;
    }
    return {
      default: {
        fill: isSelected
          ? "hsl(var(--map-highlight))"
          : isHighlighted
          ? highlightFill
          : isDimmed
          ? "hsl(var(--map-land) / 0.35)"
          : landColor,
        stroke: "hsl(var(--map-stroke))",
        strokeWidth: 0.4,
        outline: "none",
        transition: "fill 0.25s ease",
        cursor: country ? "pointer" : "default",
      },
      hover: {
        fill: country ? "hsl(var(--map-land-hover))" : landColor,
        stroke: "hsl(var(--accent))",
        strokeWidth: 0.6,
        outline: "none",
        cursor: country ? "pointer" : "default",
      },
      pressed: { fill: "hsl(var(--map-highlight))", outline: "none" },
    };
  };

  const projection = isGlobe ? "geoOrthographic" : "geoEqualEarth";
  const projectionConfig = isGlobe
    ? { scale: 240, rotate: rotation }
    : { scale: 175, rotate: CENTER_ROTATE };

  const renderGeographies = () => (
    <Geographies geography={GEO_URL}>
      {({ geographies }) =>
        geographies.map((geo) => {
          const country = getCountryByGeoId(geo.id);
          const isHovered = country?.iso && country.iso === hoveredIso;
          return (
            <Geography
              key={geo.rsmKey}
              geography={geo}
              tabIndex={-1}
              onMouseEnter={(e) => country && enterCountry(country, e.clientX, e.clientY)}
              onMouseMove={(e) =>
                setTooltip((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY } : prev))
              }
              onMouseLeave={leave}
              onClick={() => country && selectCountry(country.iso)}
              style={geoStyle(country)}
              className={cn(isHovered && "drop-shadow")}
            />
          );
        })
      }
    </Geographies>
  );

  const markers = (
    <>
      <IslandMarkers
        onSelect={(iso) => selectCountry(iso)}
        onEnter={enterCountry}
        onLeave={leave}
        highlightSet={highlightSet}
        selectedIso={selectedIso}
      />
      <PolarMarkers onEnterTip={enterTip} onLeaveTip={leaveTip} />
      {showAdmin && (
        <AdminCapitalSvgMarkers
          locale={locale}
          activeIso={selectedIso || hoveredIso}
          onEnterTip={enterTip}
          onLeaveTip={leaveTip}
        />
      )}
    </>
  );

  return (
    <div className="relative h-full w-full overflow-hidden">
      {isTerrain ? (
        <TerrainMap />
      ) : (
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          className="keep-ltr h-full w-full"
          style={{ cursor: isGlobe ? (dragRef.current ? "grabbing" : "grab") : "default" }}
        >
          <ComposableMap
            projection={projection}
            projectionConfig={projectionConfig}
            className="h-full w-full"
            style={{
              background: "hsl(var(--map-ocean))",
              transition: "background 0.5s ease",
            }}
          >
            {isGlobe ? (
              <>
                <Sphere id="globe-sphere" fill="hsl(var(--map-ocean))" stroke="hsl(var(--border))" strokeWidth={0.5} />
                <Graticule stroke="hsl(var(--map-stroke) / 0.4)" strokeWidth={0.3} />
                {renderGeographies()}
                {markers}
              </>
            ) : (
              <ZoomableGroup
                zoom={position.zoom}
                center={position.coordinates}
                onMoveEnd={handleMove}
                maxZoom={8}
              >
                {renderGeographies()}
                {markers}
                {highlightSet && !selectedIso && (
                  <FilterLabels
                    highlightSet={highlightSet}
                    onSelect={(iso) => selectCountry(iso)}
                    onEnter={enterCountry}
                    onLeave={leave}
                    values={insightValues}
                    scale={insightScale}
                    cssVar={insightCssVar}
                    diverging={insightDiverging}
                  />
                )}
              </ZoomableGroup>
            )}
          </ComposableMap>
        </div>
      )}

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-40 flex max-w-xs items-center gap-2 rounded-lg border border-border bg-elevated px-3 py-1.5 text-sm font-medium text-primary shadow-md"
          style={{ left: tooltip.x + 14, top: tooltip.y + 14 }}
        >
          {tooltip.flag && tooltip.iso && (
            <FlagIcon iso={tooltip.iso} emoji={tooltip.flag} name={tooltip.label} className="h-4 w-6" />
          )}
          {tooltip.flag && !tooltip.iso && <span className="text-base leading-none">{tooltip.flag}</span>}
          {tooltip.label}
        </div>
      )}

      {/* View toggle */}
      <MapViewToggle />

      {/* Zoom controls (globe 模式仅保留重置；terrain 用 Leaflet 自带控件) */}
      {!isTerrain && (
        <div className="absolute bottom-6 end-6 flex flex-col gap-1.5">
          {!isGlobe && (
            <>
              <MapButton onClick={zoomIn} label={t("map.zoomIn")}>
                <Plus size={18} />
              </MapButton>
              <MapButton onClick={zoomOut} label={t("map.zoomOut")}>
                <Minus size={18} />
              </MapButton>
            </>
          )}
          <MapButton onClick={reset} label={t("map.reset")}>
            <Locate size={18} />
          </MapButton>
        </div>
      )}

      {/* Hint */}
      {!isTerrain && (
        <div className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 rounded-full border border-border bg-glass px-4 py-1.5 text-xs text-muted backdrop-blur md:block">
          {isGlobe ? t("map.hintGlobe") : t("map.hint")}
        </div>
      )}
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
