import { create } from "zustand";
import type { FilterDimension, LocalizedText } from "@/types/country";

/** 发散型着色配置（如男女比例，以中点向两侧分色）。 */
export interface DivergingSpec {
  midpoint: number;
  lowCssVar: string;
  highCssVar: string;
  lowLabel: LocalizedText;
  highLabel: LocalizedText;
}

export interface ActiveFilter {
  dimension: FilterDimension | "insight";
  value: string;
  /** 展示标签（已本地化） */
  label: string;
  /** 命中国家的 iso 集合，用于地图高亮 */
  countries: Set<string>;
  /** 可选：每国数值（诺贝尔次数/男女比例等），用于加深显示与徽标 */
  values?: Record<string, number>;
  /** 可选：图例颜色 css 变量名（如 "--dim-holiday"），insight 维度用 */
  cssVar?: string;
  /** 可选：数值单位（本地化），用于图例与徽标 */
  unit?: LocalizedText;
  /** 可选：发散型着色（男女比例等） */
  diverging?: DivergingSpec;
  /** 可选：每国附加年份（世界杯夺冠年份等） */
  years?: Record<string, number[]>;
}

/** 地图视角：平面 / 3D地球 / 地形 */
export type MapView = "flat" | "globe" | "terrain";

interface ExploreState {
  selectedIso: string | null;
  hoveredIso: string | null;
  activeFilter: ActiveFilter | null;
  aiOpen: boolean;
  settingsOpen: boolean;
  mapView: MapView;
  /** 是否在地图上显示二级行政区（省会/首府）打点 */
  showAdmin: boolean;
  /** 就地下钻到的国家（省级），null 表示世界视图 */
  drillIso: string | null;

  selectCountry: (iso: string | null) => void;
  setHovered: (iso: string | null) => void;
  setFilter: (filter: ActiveFilter | null) => void;
  clearFilter: () => void;
  setAiOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setMapView: (view: MapView) => void;
  toggleAdmin: () => void;
  setDrillIso: (iso: string | null) => void;
}

export const useExploreStore = create<ExploreState>((set) => ({
  selectedIso: null,
  hoveredIso: null,
  activeFilter: null,
  aiOpen: false,
  settingsOpen: false,
  mapView: "flat",
  showAdmin: false,
  drillIso: null,

  selectCountry: (iso) => set({ selectedIso: iso }),
  setHovered: (iso) => set({ hoveredIso: iso }),
  setFilter: (filter) => set({ activeFilter: filter }),
  clearFilter: () => set({ activeFilter: null }),
  setAiOpen: (open) => set({ aiOpen: open }),
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  setMapView: (view) => set({ mapView: view }),
  toggleAdmin: () => set((s) => ({ showAdmin: !s.showAdmin })),
  setDrillIso: (iso) => set({ drillIso: iso }),
}));
