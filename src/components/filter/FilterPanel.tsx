import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { FILTER_DIMENSIONS } from "@/types/country";
import type { FilterDimension } from "@/types/country";
import { FILTER_DIMENSION_META } from "@/lib/dimensions";
import { useDimensionIndexes } from "@/hooks/useDimensionIndexes";
import { useExploreStore } from "@/stores/useExploreStore";
import DimensionValueList from "./DimensionValueList";
import InsightsPanel from "./InsightsPanel";

export default function FilterPanel() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const indexes = useDimensionIndexes();
  const activeFilter = useExploreStore((s) => s.activeFilter);

  const [collapsed, setCollapsed] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  const [expandedDim, setExpandedDim] = useState<FilterDimension | null>(
    activeFilter && activeFilter.dimension !== "insight"
      ? (activeFilter.dimension as FilterDimension)
      : "region"
  );

  const toggleDim = (dim: FilterDimension) =>
    setExpandedDim((cur) => (cur === dim ? null : dim));

  return (
    <div className="pointer-events-none absolute start-0 top-0 z-20 flex h-full max-h-full flex-col p-3 md:p-4">
      <motion.div
        layout
        className="pointer-events-auto flex max-h-full w-[min(18rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-border bg-glass shadow-md backdrop-blur-md"
      >
        {/* Header */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-center justify-between border-b border-border px-4 py-3"
        >
          <span className="flex items-center gap-2 font-display text-sm font-semibold text-primary">
            <SlidersHorizontal size={16} className="text-accent" />
            {t("dimensions.title")}
          </span>
          <ChevronDown
            size={16}
            className={`text-muted transition-transform ${collapsed ? "-rotate-90" : ""}`}
          />
        </button>

        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="flex min-h-0 flex-col"
            >
              {activeFilter && (
                <div className="flex items-center justify-between gap-2 border-b border-border bg-accent/8 px-4 py-2">
                  <span className="truncate text-xs text-secondary">
                    {t(`dimensions.${activeFilter.dimension}`)}:{" "}
                    <span className="font-semibold text-primary">
                      {activeFilter.label}
                    </span>
                  </span>
                  <button
                    onClick={() => navigate("/")}
                    className="flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-muted transition hover:text-accent"
                  >
                    <X size={12} />
                    {t("dimensions.clear")}
                  </button>
                </div>
              )}

              <p className="px-4 pt-3 text-xs text-muted">{t("dimensions.subtitle")}</p>

              <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
                {FILTER_DIMENSIONS.map((dim) => {
                  const meta = FILTER_DIMENSION_META[dim];
                  const index = indexes[dim];
                  const isOpen = expandedDim === dim;
                  return (
                    <div key={dim} className="rounded-xl border border-border/60">
                      <button
                        onClick={() => toggleDim(dim)}
                        className="flex w-full items-center justify-between px-3 py-2.5 text-start"
                      >
                        <span className="flex items-center gap-2 text-sm font-medium text-primary">
                          <span>{meta.emoji}</span>
                          {t(`dimensions.${dim}`)}
                        </span>
                        <span className="flex items-center gap-2">
                          {index && (
                            <span className="text-xs text-muted">
                              {Object.keys(index).length}
                            </span>
                          )}
                          <ChevronDown
                            size={14}
                            className={`text-muted transition-transform ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          />
                        </span>
                      </button>
                      <AnimatePresence initial={false}>
                        {isOpen && index && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="max-h-64 overflow-y-auto px-2 pb-2">
                              <DimensionValueList
                                dimension={dim}
                                index={index}
                                activeValue={
                                  activeFilter?.dimension === dim
                                    ? activeFilter.value
                                    : undefined
                                }
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
                <div className="mt-1 border-t border-border/60 pt-1">
                  <InsightsPanel />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
