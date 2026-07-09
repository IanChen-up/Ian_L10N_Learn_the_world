import type { LocalizedText } from "@/types/country";

export interface AdminCapital {
  name: LocalizedText;
  region: LocalizedText;
  latlng: [number, number];
}

export type AdminCapitalsMap = Record<string, AdminCapital[]>;

const BASE = import.meta.env.BASE_URL || "/";
let cache: AdminCapitalsMap | null = null;
let inflight: Promise<AdminCapitalsMap> | null = null;

/** 加载全球一级行政区首府（省会/州府）打点数据。 */
export async function loadAdminCapitals(): Promise<AdminCapitalsMap> {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = fetch(`${BASE}data/admin-capitals.json`)
    .then((r) => (r.ok ? r.json() : {}))
    .then((d: AdminCapitalsMap & { _comment?: string }) => {
      if (d && d._comment) delete d._comment;
      cache = d || {};
      return cache;
    })
    .catch(() => ({}));
  return inflight;
}
