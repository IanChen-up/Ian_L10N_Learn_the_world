import { motion } from "framer-motion";
import type { ReactNode } from "react";
import type { DisplayDimension } from "@/types/country";
import { DISPLAY_DIMENSION_META } from "@/lib/dimensions";

interface DimensionCardProps {
  dimension: DisplayDimension;
  title: string;
  index: number;
  children: ReactNode;
}

export default function DimensionCard({
  dimension,
  title,
  index,
  children,
}: DimensionCardProps) {
  const meta = DISPLAY_DIMENSION_META[dimension];

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay: 0.05 + index * 0.05 }}
      className="rounded-2xl border border-border bg-elevated/60 p-4"
      style={{ borderInlineStartColor: `hsl(var(${meta.cssVar}))`, borderInlineStartWidth: 3 }}
    >
      <div className="mb-2.5 flex items-center gap-2">
        <span className="text-lg leading-none">{meta.emoji}</span>
        <h3
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: `hsl(var(${meta.cssVar}))` }}
        >
          {title}
        </h3>
      </div>
      <div className="text-sm text-primary">{children}</div>
    </motion.section>
  );
}
