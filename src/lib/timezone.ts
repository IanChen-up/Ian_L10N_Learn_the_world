/** 时区工具：解析 "UTC+09:00" 偏移，计算当地实时时间。 */

/** 解析 world-countries 的时区字符串（如 "UTC+09:00" / "UTC-05:00" / "UTC"）为分钟偏移。 */
export function parseUtcOffsetMinutes(tz: string): number | null {
  if (!tz) return null;
  const m = tz.match(/UTC([+-])(\d{2}):?(\d{2})/);
  if (!m) return tz === "UTC" ? 0 : null;
  const sign = m[1] === "-" ? -1 : 1;
  const hours = Number(m[2]);
  const mins = Number(m[3]);
  return sign * (hours * 60 + mins);
}

/** 根据 UTC 偏移分钟数，返回该时区的当前时间（Date 对象，其 UTC 字段即为目标时区的本地时间）。 */
export function nowAtOffset(offsetMinutes: number): Date {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utcMs + offsetMinutes * 60000);
}

/** 格式化为 HH:MM。 */
export function formatClock(d: Date): string {
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

/** 把偏移分钟数格式化回 "UTC+9" / "UTC-5:30" 风格。 */
export function formatOffsetLabel(offsetMinutes: number): string {
  const sign = offsetMinutes < 0 ? "-" : "+";
  const abs = Math.abs(offsetMinutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return m === 0 ? `UTC${sign}${h}` : `UTC${sign}${h}:${String(m).padStart(2, "0")}`;
}

/** 简短相对说明：与用户本地时间的时差（小时）。 */
export function diffFromLocalHours(offsetMinutes: number): number {
  const localOffset = -new Date().getTimezoneOffset();
  return (offsetMinutes - localOffset) / 60;
}
