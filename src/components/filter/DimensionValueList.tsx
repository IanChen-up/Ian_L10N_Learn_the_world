import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { localized } from "@/services/countryData";
import { useLocaleStore } from "@/stores/useLocaleStore";
import type { DimensionIndex, FilterDimension } from "@/types/country";
import { FILTER_DIMENSION_META } from "@/lib/dimensions";

interface DimensionValueListProps {
  dimension: FilterDimension;
  index: DimensionIndex;
  activeValue?: string;
}

export default function DimensionValueList({
  dimension,
  index,
  activeValue,
}: DimensionValueListProps) {
  const { t } = useTranslation();
  const { locale } = useLocaleStore();
  const navigate = useNavigate();
  const meta = FILTER_DIMENSION_META[dimension];

  const items = useMemo(() => {
    const labelFor = (value: string, entry: DimensionIndex[string]) => {
      if (entry.label) return localized(entry.label, locale);
      if (dimension === "region") return t(`region.${value}`);
      if (dimension === "religion") return t(`religion.${value}`);
      if (dimension === "government") return t(`government.${value}`);
      return value;
    };
    return Object.entries(index)
      .map(([value, entry]) => ({
        value,
        label: labelFor(value, entry),
        count: entry.countries.length,
      }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  }, [index, dimension, locale, t]);

  return (
    <ul className="space-y-0.5">
      {items.map((item) => {
        const active = item.value === activeValue;
        return (
          <li key={item.value}>
            <button
              onClick={() =>
                navigate(`/browse/${dimension}/${encodeURIComponent(item.value)}`)
              }
              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-start text-sm transition ${
                active
                  ? "bg-accent/15 font-medium text-primary"
                  : "text-secondary hover:bg-sunken hover:text-primary"
              }`}
            >
              <span className="flex items-center gap-2 truncate">
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: `hsl(var(${meta.cssVar}))` }}
                />
                <span className="truncate">{item.label}</span>
              </span>
              <span className="ms-2 shrink-0 text-xs text-muted">{item.count}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
