import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useExploreStore } from "@/stores/useExploreStore";
import { loadIndex, localized } from "@/services/countryData";
import { useLocaleStore } from "@/stores/useLocaleStore";
import type { FilterDimension } from "@/types/country";
import { useTranslation } from "react-i18next";

/**
 * 将 URL 参数同步到探索状态：
 * /country/:iso   → 选中国家
 * /browse/:dimension/:value → 设置筛选高亮
 */
export function useRouteSync() {
  const params = useParams();
  const { locale } = useLocaleStore();
  const { t } = useTranslation();
  const selectCountry = useExploreStore((s) => s.selectCountry);
  const setFilter = useExploreStore((s) => s.setFilter);
  const clearFilter = useExploreStore((s) => s.clearFilter);

  const iso = params.iso;
  const dimension = params.dimension as FilterDimension | undefined;
  const value = params.value ? decodeURIComponent(params.value) : undefined;

  useEffect(() => {
    if (iso) selectCountry(iso.toUpperCase());
  }, [iso, selectCountry]);

  useEffect(() => {
    let alive = true;
    if (dimension && value) {
      // 进入维度浏览时，关闭可能打开的国家面板，
      // 否则地图与结果列表会因 selectedIso 存在而抑制筛选高亮（表现为"点了没反应"）。
      selectCountry(null);
      loadIndex(dimension)
        .then((index) => {
          if (!alive) return;
          const entry = index[value];
          const countries = new Set(entry?.countries ?? []);
          const label =
            entry?.label != null
              ? localized(entry.label, locale)
              : dimension === "region"
              ? t(`region.${value}`)
              : dimension === "religion"
              ? t(`religion.${value}`)
              : dimension === "government"
              ? t(`government.${value}`)
              : value;
          setFilter({ dimension, value, countries, label });
        })
        .catch(() => {});
    } else {
      clearFilter();
    }
    return () => {
      alive = false;
    };
  }, [dimension, value, locale, t, setFilter, clearFilter, selectCountry]);
}
