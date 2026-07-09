/** 数字格式化：人口、GDP、面积 */

export function formatPopulation(n: number | null, locale: string): string {
  if (n == null) return "—";
  if (locale === "zh") {
    if (n >= 1e8) return `${(n / 1e8).toFixed(2)} 亿`;
    if (n >= 1e4) return `${(n / 1e4).toFixed(1)} 万`;
    return String(n);
  }
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
}

export function formatGDP(n: number | null, locale: string): string {
  if (n == null) return "—";
  if (locale === "zh") {
    if (n >= 1e12) return `$${(n / 1e12).toFixed(2)} 万亿`;
    if (n >= 1e8) return `$${(n / 1e8).toFixed(1)} 亿`;
    return `$${n.toLocaleString()}`;
  }
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  return `$${n.toLocaleString()}`;
}

export function formatArea(n: number, locale: string): string {
  if (!n) return "—";
  const num = n.toLocaleString();
  return locale === "zh" ? `${num} km²` : `${num} km²`;
}

/** GDP 亿元人民币格式化（用于中国省份） */
export function formatGdpCNY(yi: number | null | undefined, locale: string): string {
  if (yi == null) return "—";
  if (yi >= 10000) {
    const wan = (yi / 10000).toFixed(2);
    return locale === "zh" ? `¥${wan} 万亿` : `¥${wan}T`;
  }
  return locale === "zh" ? `¥${yi.toLocaleString()} 亿` : `¥${yi.toLocaleString()}00M`;
}

/** 经纬度格式化，如 39.9°N, 116.4°E */
export function formatLatLng(
  latlng: [number, number] | undefined,
  locale: string
): string {
  if (!latlng || latlng.length !== 2) return "—";
  const [lat, lng] = latlng;
  const ns = lat >= 0 ? (locale === "zh" ? "N" : "N") : "S";
  const ew = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(1)}°${ns}, ${Math.abs(lng).toFixed(1)}°${ew}`;
}
