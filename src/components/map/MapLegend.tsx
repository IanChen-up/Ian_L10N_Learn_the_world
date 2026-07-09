import { useTranslation } from "react-i18next";
import { useLocaleStore } from "@/stores/useLocaleStore";
import { localized } from "@/services/countryData";
import { buildScale } from "@/lib/insightColor";
import type { ActiveFilter } from "@/stores/useExploreStore";

/** 数值格式化：整数不留小数，其余保留一位。 */
function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

/**
 * 数值指标图例（内嵌于筛选结果面板顶部）：解释地图上的配色深浅含义。
 * - 顺序型：单色由浅到深的色带 + min/max 数值。
 * - 发散型（男女比例）：以中点分色的双向色带 + 两端含义。
 * 仅当筛选有每国数值时渲染。
 */
export default function MapLegend({ filter }: { filter: ActiveFilter }) {
  const { t } = useTranslation();
  const { locale } = useLocaleStore();

  const values = filter.values;
  const cssVar = filter.cssVar;
  if (!values || !cssVar) return null;
  const scale = buildScale(values, filter.diverging);
  if (!scale) return null;

  const unit = filter.unit ? localized(filter.unit, locale) : "";
  const div = filter.diverging;

  return (
    <div className="border-b border-border px-4 py-2.5">
      {div ? (
        <>
          <div
            className="h-2.5 w-full rounded-full"
            style={{
              background: `linear-gradient(90deg, hsl(var(${div.lowCssVar})) 0%, hsl(var(--bg-elevated)) 50%, hsl(var(${div.highCssVar})) 100%)`,
            }}
          />
          <div className="mt-1 flex items-center justify-between text-[10px] text-muted">
            <span>{localized(div.lowLabel, locale)}</span>
            <span className="text-secondary">{div.midpoint}{unit ? ` ${unit}` : ""}</span>
            <span>{localized(div.highLabel, locale)}</span>
          </div>
        </>
      ) : (
        <>
          <div
            className="h-2.5 w-full rounded-full"
            style={{
              background: `linear-gradient(90deg, hsl(var(${cssVar}) / 0.32) 0%, hsl(var(${cssVar}) / 0.98) 100%)`,
            }}
          />
          <div className="mt-1 flex items-center justify-between text-[10px] text-muted">
            <span>{t("legend.low")} · {fmt(scale.min)}{unit ? ` ${unit}` : ""}</span>
            <span>{t("legend.high")} · {fmt(scale.max)}{unit ? ` ${unit}` : ""}</span>
          </div>
        </>
      )}
    </div>
  );
}
