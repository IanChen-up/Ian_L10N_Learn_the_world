import type { ProvinceMap } from "@/types/province";

const BASE = import.meta.env.BASE_URL || "/";

/** 支持省级/州级下钻的国家（iso → 地图与数据 key）。 */
const SUBDIVISION_COUNTRIES: Record<string, { geo: string; data: string; label: string }> = {
  CN: { geo: "china-provinces.json", data: "cn-provinces.json", label: "中国" },
  US: { geo: "us-states.json", data: "us-provinces.json", label: "United States" },
};

export function hasSubdivisions(iso: string): boolean {
  return iso in SUBDIVISION_COUNTRIES;
}

export function getSubdivisionConfig(iso: string) {
  return SUBDIVISION_COUNTRIES[iso];
}

const provinceCache: Record<string, ProvinceMap> = {};

export async function loadProvinces(iso: string): Promise<ProvinceMap> {
  const cfg = SUBDIVISION_COUNTRIES[iso];
  if (!cfg) throw new Error(`No subdivisions for ${iso}`);
  if (provinceCache[iso]) return provinceCache[iso];
  const res = await fetch(`${BASE}data/${cfg.data}`);
  if (!res.ok) throw new Error(`Failed to load provinces: ${res.status}`);
  const data = (await res.json()) as ProvinceMap;
  provinceCache[iso] = data;
  return data;
}

export function getProvinceGeoUrl(iso: string): string {
  const cfg = SUBDIVISION_COUNTRIES[iso];
  return `${BASE}data/${cfg.geo}`;
}
