import { Marker } from "react-simple-maps";
import type { Country } from "@/types/country";
import { getLoadedCountries } from "@/services/countryData";

/**
 * 微型岛国即便在 50m 矢量中也可能缺失多边形；
 * 用经纬度打点补齐，保证"大洋洲岛国"等在地图上可见、可点。
 */
const MARKER_ISOS = new Set([
  "TV", "NR", "MH", "FM", "KI", "PW", "TO", "WS", "MV",
]);

interface Props {
  onSelect: (iso: string) => void;
  onEnter: (c: Country, x: number, y: number) => void;
  onLeave: () => void;
  highlightSet: Set<string> | null;
  selectedIso: string | null;
}

export default function IslandMarkers({ onSelect, onEnter, onLeave, highlightSet, selectedIso }: Props) {
  const countries = getLoadedCountries();
  return (
    <>
      {countries
        .filter((c) => MARKER_ISOS.has(c.iso) && c.latlng && c.latlng.length === 2)
        .map((c) => {
          const [lat, lng] = c.latlng as [number, number];
          const isSel = c.iso === selectedIso;
          const dimmed = highlightSet ? !highlightSet.has(c.iso) : false;
          const hi = highlightSet ? highlightSet.has(c.iso) : false;
          return (
            <Marker
              key={c.iso}
              coordinates={[lng, lat]}
              onMouseEnter={(e) => onEnter(c, e.clientX, e.clientY)}
              onMouseLeave={onLeave}
              onClick={() => onSelect(c.iso)}
              style={{ default: { cursor: "pointer" }, hover: { cursor: "pointer" }, pressed: {} }}
            >
              <circle
                r={isSel ? 3.4 : 2.4}
                fill={
                  isSel
                    ? "hsl(var(--map-highlight))"
                    : hi
                    ? "hsl(var(--accent))"
                    : dimmed
                    ? "hsl(var(--map-land) / 0.4)"
                    : "hsl(var(--map-land))"
                }
                stroke="hsl(var(--accent))"
                strokeWidth={0.7}
              />
            </Marker>
          );
        })}
    </>
  );
}
