import { Marker } from "react-simple-maps";
import type { Country } from "@/types/country";
import { getLoadedCountries } from "@/services/countryData";
import { fillForValue, type InsightScale } from "@/lib/insightColor";
import type { DivergingSpec } from "@/stores/useExploreStore";

/** 面积阈值（km²）：小于此值的国家在筛选高亮时用圆点标记，便于在地图上定位。 */
const SMALL_AREA = 120000;

interface Props {
  highlightSet: Set<string>;
  onSelect: (iso: string) => void;
  onEnter: (c: Country, x: number, y: number) => void;
  onLeave: () => void;
  /** insight 维度：每国数值 / 标尺 / 颜色变量 / 发散配置（用于给圆点上色） */
  values?: Record<string, number> | null;
  scale?: InsightScale | null;
  cssVar?: string | null;
  diverging?: DivergingSpec | null;
}

/**
 * 维度筛选命中一批国家时，对面积过小、地图上难以辨认的国家打「圆点」标记（不再打文字标签）。
 * 名称由悬停时的浮层（旗帜+国名）按需显示，避免此前多国文字标签相互重叠、糊成一团的问题。
 * 仅在平面视角、有筛选且未选中单国时渲染。
 */
export default function FilterLabels({
  highlightSet,
  onSelect,
  onEnter,
  onLeave,
  values,
  scale,
  cssVar,
  diverging,
}: Props) {
  const countries = getLoadedCountries();
  const smalls = countries.filter(
    (c) =>
      highlightSet.has(c.iso) &&
      c.latlng &&
      c.latlng.length === 2 &&
      (c.area || 0) < SMALL_AREA
  );
  if (smalls.length === 0) return null;

  return (
    <>
      {smalls.map((c) => {
        const [lat, lng] = c.latlng as [number, number];
        const fill =
          values && scale && cssVar
            ? fillForValue(values[c.iso], scale, cssVar, diverging)
            : "hsl(var(--accent))";
        return (
          <Marker
            key={c.iso}
            coordinates={[lng, lat]}
            onMouseEnter={(e) => onEnter(c, e.clientX, e.clientY)}
            onMouseMove={(e) => onEnter(c, e.clientX, e.clientY)}
            onMouseLeave={onLeave}
            onClick={() => onSelect(c.iso)}
            style={{ default: { cursor: "pointer" }, hover: { cursor: "pointer" }, pressed: {} }}
          >
            <circle r={2.6} fill={fill} stroke="white" strokeWidth={0.7} />
          </Marker>
        );
      })}
    </>
  );
}
