import type { DivergingSpec } from "@/stores/useExploreStore";

/**
 * 数值型指标的着色标尺。
 * 采用「分位/排名」归一化而非线性 min-max：颜色深浅按国家在排序中的位置决定，
 * 这样即便存在极端离群值（如男女比例的卡塔尔 248），大多数国家之间的细小差异也能拉开色阶。
 */
export interface InsightScale {
  min: number;
  max: number;
  /** 顺序型：全部数值升序（用于排名归一化） */
  sorted: number[];
  /** 发散型中点 */
  mid?: number;
  /** 发散型：高于中点的偏离量升序 */
  posSorted?: number[];
  /** 发散型：低于中点的偏离量（取绝对值）升序 */
  negSorted?: number[];
}

const ALPHA_MIN = 0.18;
const ALPHA_SPAN = 0.82;

/** 二分：返回 arr 中严格小于 v 的元素个数（arr 升序）。 */
function countLess(arr: number[], v: number): number {
  let lo = 0;
  let hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] < v) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/** 二分：返回 arr 中小于等于 v 的元素个数（arr 升序）。 */
function countLessEqual(arr: number[], v: number): number {
  let lo = 0;
  let hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] <= v) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/** v 在升序数组中的分位（0~1）：用中位排名，min→0、max→1，同值取平均位次。 */
function rankFraction(sorted: number[], v: number): number {
  const n = sorted.length;
  if (n <= 1) return 1;
  const less = countLess(sorted, v);
  const lessEq = countLessEqual(sorted, v);
  const midrank = (less + lessEq - 1) / 2; // 0-indexed 平均位次
  return Math.max(0, Math.min(1, midrank / (n - 1)));
}

/** 由每国数值构造着色标尺。传入 diverging 时按中点两侧分别排名。 */
export function buildScale(
  values: Record<string, number> | null | undefined,
  diverging?: DivergingSpec | null,
): InsightScale | null {
  if (!values) return null;
  const nums = Object.values(values).filter((v) => typeof v === "number" && !Number.isNaN(v));
  if (!nums.length) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  if (diverging) {
    const mid = diverging.midpoint;
    const posSorted = nums.filter((v) => v > mid).map((v) => v - mid).sort((a, b) => a - b);
    const negSorted = nums.filter((v) => v < mid).map((v) => mid - v).sort((a, b) => a - b);
    return { min, max, sorted, mid, posSorted, negSorted };
  }
  return { min, max, sorted };
}

/**
 * 计算单个国家在该指标下的填充色（hsl 字符串）。
 * 顺序型：用 cssVar 单色，透明度按「排名分位」映射（离群值不再压扁其他国家）。
 * 发散型：以中点分色，偏高用 highCssVar、偏低用 lowCssVar，强度按各自一侧的排名分位。
 */
export function fillForValue(
  v: number | null | undefined,
  scale: InsightScale,
  cssVar: string,
  diverging?: DivergingSpec | null,
): string {
  if (v == null || Number.isNaN(v)) return `hsl(var(${cssVar}) / 0.7)`;
  if (diverging && scale.mid != null) {
    if (v === scale.mid) return `hsl(var(${cssVar}) / ${ALPHA_MIN.toFixed(2)})`;
    const high = v > scale.mid;
    const varName = high ? diverging.highCssVar : diverging.lowCssVar;
    const side = high ? scale.posSorted : scale.negSorted;
    const dev = high ? v - scale.mid : scale.mid - v;
    const frac = side && side.length ? rankFraction(side, dev) : 1;
    const alpha = ALPHA_MIN + ALPHA_SPAN * frac;
    return `hsl(var(${varName}) / ${alpha.toFixed(2)})`;
  }
  const frac = rankFraction(scale.sorted, v);
  const alpha = ALPHA_MIN + ALPHA_SPAN * frac;
  return `hsl(var(${cssVar}) / ${alpha.toFixed(2)})`;
}
