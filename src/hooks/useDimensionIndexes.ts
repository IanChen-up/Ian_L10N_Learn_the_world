import { useEffect, useState } from "react";
import { loadIndex } from "@/services/countryData";
import type { DimensionIndex, FilterDimension } from "@/types/country";
import { FILTER_DIMENSIONS } from "@/types/country";

export function useDimensionIndexes() {
  const [indexes, setIndexes] = useState<
    Partial<Record<FilterDimension, DimensionIndex>>
  >({});

  useEffect(() => {
    let alive = true;
    Promise.all(FILTER_DIMENSIONS.map((d) => loadIndex(d).then((idx) => [d, idx] as const)))
      .then((pairs) => {
        if (!alive) return;
        const map: Partial<Record<FilterDimension, DimensionIndex>> = {};
        for (const [d, idx] of pairs) map[d] = idx;
        setIndexes(map);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return indexes;
}
