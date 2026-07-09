import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { formatGDP, formatGdpCNY } from "@/lib/format";
import { useLocaleStore } from "@/stores/useLocaleStore";
import { localized } from "@/services/countryData";
import type { ProvinceGdpSource } from "@/types/province";

interface Point {
  year: number;
  value: number;
}

const BASE = import.meta.env.BASE_URL || "/";
const cache = new Map<string, Point[]>();

async function loadHistory(key: string): Promise<Point[]> {
  if (cache.has(key)) return cache.get(key)!;
  try {
    const res = await fetch(`${BASE}data/province-gdp-history.json`);
    const all = res.ok ? await res.json() : {};
    const pts: Point[] = all[key] ?? [];
    cache.set(key, pts);
    return pts;
  } catch {
    return [];
  }
}

export default function ProvinceGdpHistoryModal({
  historyKey,
  name,
  currency,
  source,
  onClose,
}: {
  historyKey: string;
  name: string;
  currency: "USD" | "CNY";
  source?: ProvinceGdpSource;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { locale } = useLocaleStore();
  const [points, setPoints] = useState<Point[] | null>(null);

  useEffect(() => {
    let alive = true;
    loadHistory(historyKey).then((p) => alive && setPoints(p));
    return () => {
      alive = false;
    };
  }, [historyKey]);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ type: "spring", damping: 26, stiffness: 320 }}
          className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-base shadow-lg"
        >
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="font-display text-lg font-semibold text-primary">
              📈 {name} · {t("gdpChart.title")}
            </h2>
            <button
              onClick={onClose}
              aria-label={t("panel.close")}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-sunken hover:text-primary"
            >
              <X size={18} />
            </button>
          </div>
          <div className="p-6">
            {points === null ? (
              <div className="flex h-64 items-center justify-center text-muted">
                <Loader2 className="animate-spin" size={24} />
              </div>
            ) : points.length < 2 ? (
              <p className="py-16 text-center text-sm text-muted">{t("gdpChart.noData")}</p>
            ) : (
              <Chart points={points} locale={locale} currency={currency} />
            )}
            {source && (
              <p className="mt-3 text-[11px] leading-relaxed text-muted">
                {source.url ? (
                  <a href={source.url} target="_blank" rel="noopener noreferrer" className="hover:text-accent">
                    {localized(source.label, locale)}
                  </a>
                ) : (
                  localized(source.label, locale)
                )}
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function Chart({
  points,
  locale,
  currency,
}: {
  points: Point[];
  locale: string;
  currency: "USD" | "CNY";
}) {
  const { t } = useTranslation();
  const W = 600;
  const H = 260;
  const padL = 56;
  const padR = 16;
  const padT = 16;
  const padB = 28;
  const years = points.map((p) => p.year);
  const vals = points.map((p) => p.value);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);
  const maxVal = Math.max(...vals);

  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<Point | null>(null);

  const fmt = (v: number) => (currency === "CNY" ? formatGdpCNY(v, locale) : formatGDP(v, locale));
  const x = (year: number) =>
    padL + ((year - minYear) / (maxYear - minYear)) * (W - padL - padR);
  const y = (v: number) => padT + (1 - v / maxVal) * (H - padT - padB);

  const line = points.map((p) => `${x(p.year)},${y(p.value)}`).join(" ");
  const area = `${padL},${H - padB} ${line} ${x(maxYear)},${H - padB}`;
  const decadeTicks: number[] = [];
  for (let yr = Math.ceil(minYear / 10) * 10; yr <= maxYear; yr += 10) decadeTicks.push(yr);

  const handleMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    const ratio = (svgX - padL) / (W - padL - padR);
    const targetYear = minYear + ratio * (maxYear - minYear);
    let nearest = points[0];
    let best = Infinity;
    for (const p of points) {
      const d = Math.abs(p.year - targetYear);
      if (d < best) {
        best = d;
        nearest = p;
      }
    }
    setHover(nearest);
  };

  const hx = hover ? x(hover.year) : 0;
  const hy = hover ? y(hover.value) : 0;
  const tipW = 120;
  const tipLeft = hover ? (hx + tipW + 8 > W ? hx - tipW - 8 : hx + 8) : 0;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      className="w-full touch-none"
      role="img"
      aria-label={t("gdpChart.title")}
      onPointerMove={handleMove}
      onPointerLeave={() => setHover(null)}
    >
      {[0, 0.5, 1].map((f) => {
        const val = maxVal * f;
        const yy = y(val);
        return (
          <g key={f}>
            <line x1={padL} y1={yy} x2={W - padR} y2={yy} stroke="hsl(var(--border))" strokeWidth={0.5} />
            <text x={padL - 6} y={yy + 3} textAnchor="end" fontSize={9} fill="hsl(var(--text-muted))">
              {fmt(val)}
            </text>
          </g>
        );
      })}
      {decadeTicks.map((yr) => (
        <g key={yr}>
          <line x1={x(yr)} y1={padT} x2={x(yr)} y2={H - padB} stroke="hsl(var(--border) / 0.5)" strokeWidth={0.5} strokeDasharray="2 3" />
          <text x={x(yr)} y={H - padB + 14} textAnchor="middle" fontSize={9} fill="hsl(var(--text-muted))">
            {yr}
          </text>
        </g>
      ))}
      <polygon points={area} fill="hsl(var(--accent) / 0.12)" />
      <polyline points={line} fill="none" stroke="hsl(var(--accent))" strokeWidth={1.6} />
      {[points[0], points[points.length - 1]].map((p, i) => (
        <circle key={i} cx={x(p.year)} cy={y(p.value)} r={2.6} fill="hsl(var(--accent))" />
      ))}
      {hover && (
        <g pointerEvents="none">
          <line x1={hx} y1={padT} x2={hx} y2={H - padB} stroke="hsl(var(--accent))" strokeWidth={0.8} strokeDasharray="3 2" />
          <circle cx={hx} cy={hy} r={4} fill="hsl(var(--accent))" stroke="hsl(var(--bg-base))" strokeWidth={1.5} />
          <g transform={`translate(${tipLeft}, ${padT + 4})`}>
            <rect width={tipW} height={34} rx={6} fill="hsl(var(--bg-elevated))" stroke="hsl(var(--border))" strokeWidth={0.6} />
            <text x={8} y={14} fontSize={10} fill="hsl(var(--text-muted))">
              {hover.year}
            </text>
            <text x={8} y={27} fontSize={11} fontWeight={600} fill="hsl(var(--text-primary))">
              {fmt(hover.value)}
            </text>
          </g>
        </g>
      )}
      <rect x={padL} y={padT} width={W - padL - padR} height={H - padT - padB} fill="transparent" />
      <title>{t("gdpChart.title")}</title>
    </svg>
  );
}

