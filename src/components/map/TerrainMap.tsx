import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Tooltip, useMap } from "react-leaflet";
import type { Layer, PathOptions } from "leaflet";
import type { Feature, GeoJsonObject } from "geojson";
import * as topojson from "topojson-client";
import { useTranslation } from "react-i18next";
import { useThemeStore } from "@/stores/useThemeStore";
import { useExploreStore } from "@/stores/useExploreStore";
import { useLocaleStore } from "@/stores/useLocaleStore";
import { getCountryByGeoId, localized } from "@/services/countryData";
import { POLAR_STATIONS } from "@/data/polarStations";
import AdminCapitalMarkers from "./AdminCapitalMarkers";
import "leaflet/dist/leaflet.css";

const ATLAS_URL = `${import.meta.env.BASE_URL || "/"}data/world-atlas.json`;

// Esri 地形底图（免费、无需 key）+ 高德中文注记。这样 GitHub Pages 上不依赖天地图 key/域名白名单。
const PHYSICAL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}";
const TERRAIN_SHADED =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Hillshade/MapServer/tile/{z}/{y}/{x}";
const ESRI_ATTR = "Tiles &copy; Esri — Source: USGS, Esri, TANA, DeLorme, and NPS";
const GAODE_LABELS =
  "https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}";
const GAODE_SUBDOMAINS = ["1", "2", "3", "4"];
const GAODE_ATTR = "中文注记 &copy; 高德地图";

function FixInvalidateSize() {
  const map = useMap();
  useEffect(() => {
    const id = setTimeout(() => map.invalidateSize(), 200);
    return () => clearTimeout(id);
  }, [map]);
  return null;
}

export default function TerrainMap() {
  const { t } = useTranslation();
  const theme = useThemeStore((s) => s.theme);
  const { locale } = useLocaleStore();
  const selectCountry = useExploreStore((s) => s.selectCountry);
  const selectedIso = useExploreStore((s) => s.selectedIso);
  const hoveredIso = useExploreStore((s) => s.hoveredIso);
  const setHovered = useExploreStore((s) => s.setHovered);
  const activeFilter = useExploreStore((s) => s.activeFilter);
  const showAdmin = useExploreStore((s) => s.showAdmin);
  const [geo, setGeo] = useState<GeoJsonObject | null>(null);

  const highlightSet = activeFilter?.countries ?? null;

  useEffect(() => {
    let alive = true;
    fetch(ATLAS_URL)
      .then((r) => r.json())
      .then((topo) => {
        if (!alive) return;
        const fc = topojson.feature(topo, topo.objects.countries) as unknown as GeoJsonObject;
        setGeo(fc);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const style = useMemo(
    () =>
      (feature?: Feature): PathOptions => {
        const id = feature?.id;
        const country = id != null ? getCountryByGeoId(id as string | number) : undefined;
        const iso = country?.iso;
        const isSel = iso && iso === selectedIso;
        // 选中某国时，抑制筛选高亮/暗化，避免地图出现两处加深
        const applyFilter = Boolean(highlightSet) && !selectedIso;
        const isHi = applyFilter && iso ? highlightSet!.has(iso) : false;
        const dimmed = applyFilter && iso ? !highlightSet!.has(iso) : false;
        return {
          color: isSel ? "hsl(36 82% 52%)" : "rgba(80,70,50,0.55)",
          weight: isSel ? 2 : 0.6,
          fillColor: isSel
            ? "hsl(36 82% 52%)"
            : isHi
            ? "hsl(36 78% 55%)"
            : "hsl(36 60% 50%)",
          fillOpacity: isSel ? 0.35 : isHi ? 0.3 : dimmed ? 0 : 0.04,
        };
      },
    [selectedIso, highlightSet]
  );

  const onEach = useMemo(
    () => (feature: Feature, layer: Layer) => {
      const country = feature.id != null ? getCountryByGeoId(feature.id as string | number) : undefined;
      if (country) {
        layer.on("click", () => selectCountry(country.iso));
        layer.on("mouseover", () => setHovered(country.iso));
        layer.on("mouseout", () => setHovered(null));
        layer.bindTooltip(`${country.flag} ${localized(country.name, locale)}`, { sticky: true });
      }
    },
    [locale, selectCountry, setHovered]
  );

  return (
    <div className="absolute inset-0">
      <MapContainer
        center={[20, 120]}
        zoom={3}
        minZoom={3}
        maxZoom={12}
        maxBounds={[
          [-85, -240],
          [85, 240],
        ]}
        maxBoundsViscosity={1}
        className="keep-ltr h-full w-full"
        style={{ background: "hsl(var(--map-ocean))" }}
        attributionControl
      >
        <FixInvalidateSize />
        <TileLayer url={PHYSICAL} attribution={ESRI_ATTR} noWrap />
        <TileLayer url={TERRAIN_SHADED} opacity={theme === "dark" ? 0.5 : 0.35} noWrap />
        <TileLayer
          url={GAODE_LABELS}
          subdomains={GAODE_SUBDOMAINS}
          attribution={GAODE_ATTR}
          opacity={theme === "dark" ? 0.8 : 0.95}
          noWrap
        />
        {geo && (
          <GeoJSON
            key={`${selectedIso}-${highlightSet ? "f" : "n"}`}
            data={geo}
            style={style}
            onEachFeature={onEach}
          />
        )}
        {/* 极地科考站标注（中国站红色高亮） */}
        {POLAR_STATIONS.map((s) => (
          <CircleMarker
            key={s.id}
            center={s.latlng}
            radius={s.cn ? 5 : 4}
            pathOptions={{
              color: s.cn ? "#dc2626" : "#64748b",
              weight: 1.5,
              fillColor: s.cn ? "#ef4444" : "#94a3b8",
              fillOpacity: 0.9,
            }}
          >
            <Tooltip>
              <b>{s.cn ? "🇨🇳 " : "🔬 "}{localized(s.name, locale)}</b>
              <br />
              {localized(s.note, locale)}
            </Tooltip>
          </CircleMarker>
        ))}
        {/* 二级行政区首府打点（受"显示二级信息"开关控制，仅显示悬停/选中国家） */}
        {showAdmin && <AdminCapitalMarkers activeIso={selectedIso || hoveredIso} />}
      </MapContainer>
      <div className="pointer-events-none absolute bottom-6 left-1/2 z-[500] hidden -translate-x-1/2 rounded-full border border-border bg-glass px-4 py-1.5 text-xs text-muted backdrop-blur md:block">
        {t("map.hintTerrain")}
      </div>
    </div>
  );
}
