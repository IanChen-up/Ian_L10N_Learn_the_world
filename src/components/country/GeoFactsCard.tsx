import { useTranslation } from "react-i18next";
import { Clock, Car, Plug, Ruler, CalendarDays } from "lucide-react";
import type { Country } from "@/types/country";
import { useNowTick } from "@/hooks/useNowTick";
import {
  parseUtcOffsetMinutes,
  nowAtOffset,
  formatClock,
  formatOffsetLabel,
  diffFromLocalHours,
} from "@/lib/timezone";

/** 从多个时区里挑选最贴近首都经度的一个（用经度粗略推算 UTC 偏移）。 */
function pickTimezone(country: Country): string | null {
  const zones = country.timezones;
  if (!zones || zones.length === 0) return null;
  if (zones.length === 1) return zones[0];
  const lng = country.latlng?.[1];
  if (lng == null) return zones[0];
  const targetOffset = Math.round((lng / 15)) * 60; // 经度→分钟偏移
  let best = zones[0];
  let bestDiff = Infinity;
  for (const z of zones) {
    const off = parseUtcOffsetMinutes(z);
    if (off == null) continue;
    const d = Math.abs(off - targetOffset);
    if (d < bestDiff) {
      bestDiff = d;
      best = z;
    }
  }
  return best;
}

export default function GeoFactsCard({ country }: { country: Country }) {
  const { t } = useTranslation();
  useNowTick(30000);

  const tz = pickTimezone(country);
  const offset = tz ? parseUtcOffsetMinutes(tz) : null;
  const hasMulti = (country.timezones?.length ?? 0) > 1;

  const rows: { icon: React.ReactNode; label: string; value: React.ReactNode }[] = [];

  if (offset != null) {
    const localTime = formatClock(nowAtOffset(offset));
    const diff = diffFromLocalHours(offset);
    const diffText =
      diff === 0
        ? t("geo.sameAsYou")
        : diff > 0
        ? t("geo.aheadHours", { h: Math.abs(diff) % 1 === 0 ? Math.abs(diff) : Math.abs(diff).toFixed(1) })
        : t("geo.behindHours", { h: Math.abs(diff) % 1 === 0 ? Math.abs(diff) : Math.abs(diff).toFixed(1) });
    rows.push({
      icon: <Clock size={15} />,
      label: t("geo.timezone"),
      value: (
        <span className="flex flex-col items-end">
          <span className="font-semibold tabular-nums">
            🕐 {localTime}
            <span className="ms-1.5 text-xs font-normal text-muted">
              {formatOffsetLabel(offset)}
              {hasMulti ? " *" : ""}
            </span>
          </span>
          <span className="text-[11px] text-muted">{diffText}</span>
        </span>
      ),
    });
  }

  if (country.drivingSide) {
    rows.push({
      icon: <Car size={15} />,
      label: t("geo.driving"),
      value: country.drivingSide === "left" ? t("geo.driveLeft") : t("geo.driveRight"),
    });
  }

  if (country.electricity) {
    const e = country.electricity;
    rows.push({
      icon: <Plug size={15} />,
      label: t("geo.power"),
      value: (
        <span className="text-end">
          {e.voltage} · {e.frequency}
          <span className="ms-1.5 text-xs text-muted">
            {t("geo.plug")} {e.plugs.join(" / ")}
          </span>
        </span>
      ),
    });
  }

  if (country.measurement) {
    const key =
      country.measurement === "imperial"
        ? "geo.imperial"
        : country.measurement === "mixed"
        ? "geo.mixed"
        : "geo.metric";
    rows.push({ icon: <Ruler size={15} />, label: t("geo.measurement"), value: t(key) });
  }

  if (country.startOfWeek) {
    const key =
      country.startOfWeek === "sunday"
        ? "geo.sunday"
        : country.startOfWeek === "saturday"
        ? "geo.saturday"
        : "geo.monday";
    rows.push({ icon: <CalendarDays size={15} />, label: t("geo.weekStart"), value: t(key) });
  }

  if (rows.length === 0) return null;

  return (
    <section
      className="rounded-2xl border border-border bg-elevated/60 p-4"
      style={{ borderInlineStartColor: "hsl(var(--dim-capital))", borderInlineStartWidth: 3 }}
    >
      <div className="mb-2.5 flex items-center gap-2">
        <span style={{ color: "hsl(var(--dim-capital))" }}>
          <Clock size={15} />
        </span>
        <h3
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: "hsl(var(--dim-capital))" }}
        >
          {t("geo.title")}
        </h3>
      </div>
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="flex items-start justify-between gap-3">
            <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted">
              {r.icon}
              {r.label}
            </span>
            <span className="text-end text-sm font-medium text-primary">{r.value}</span>
          </div>
        ))}
      </div>
      {hasMulti && (
        <p className="mt-2 text-[11px] leading-snug text-muted">* {t("geo.multiTz")}</p>
      )}
    </section>
  );
}
