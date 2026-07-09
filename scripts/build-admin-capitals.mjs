/**
 * 生成全球一级行政区首府（省会/州府）打点数据 · Atlas
 *
 * 数据源：Natural Earth 1:10m Populated Places（FEATURECLA = "Admin-1 capital"），
 *   含 100% 中文名（NAME_ZH，简体），权威、公开、可商用（public domain）。
 * 输出：scripts/sources/admin-capitals-global.json（iso2 → [{name,region,latlng}]）
 *
 * 政治合规：
 *   - 跳过 TWN（台湾是中国一部分，不作为独立"国家"打点）。
 *   - 跳过 CHN（中国大陆已有省级下钻，避免与之重复）。
 *   - 仅保留能映射到站内 194 国 iso2 的条目（非主权属地自动排除）。
 *   - 手工精校的 16 国（admin-capitals.json）由 build-data 合并时优先，本文件不含它们。
 *
 * 运行：node scripts/build-admin-capitals.mjs
 */
import { writeFile, readFile, mkdir, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const CACHE = join(ROOT, "node_modules", ".cache", "ne_populated_places.geojson");
const OUT = join(__dirname, "sources", "admin-capitals-global.json");

// jsdelivr 镜像（较 GitHub raw 更少限流）
const NE_URL =
  "https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@master/geojson/ne_10m_populated_places.geojson";

/** 每国最多保留的省会数（多数国家远小于此，仅约束极端大国的文件体积）。 */
const MAX_PER_COUNTRY = 60;

async function loadNE() {
  try {
    await stat(CACHE);
    return JSON.parse(await readFile(CACHE, "utf8"));
  } catch {
    // 未缓存：下载后写入 node_modules/.cache（不进版本库）
  }
  console.log("→ 下载 Natural Earth populated places…");
  const res = await fetch(NE_URL);
  if (!res.ok) throw new Error(`Natural Earth 下载失败 ${res.status}`);
  const text = await res.text();
  await mkdir(dirname(CACHE), { recursive: true });
  await writeFile(CACHE, text);
  return JSON.parse(text);
}

async function main() {
  // 站内国家表 → iso3 到 iso2 映射（决定哪些条目可保留）
  const countries = JSON.parse(await readFile(join(ROOT, "public", "data", "countries.json"), "utf8"));
  const iso3to2 = new Map(countries.map((c) => [c.iso3, c.iso]));

  // 手工精校国家：这些国家沿用 admin-capitals.json，不从 NE 生成
  const curated = JSON.parse(await readFile(join(__dirname, "sources", "admin-capitals.json"), "utf8"));
  const curatedSet = new Set(Object.keys(curated).filter((k) => k !== "_comment"));

  // 排除：台湾（属中国）、中国大陆（有省级下钻）
  const SKIP_A3 = new Set(["TWN", "CHN"]);

  const geo = await loadNE();
  const feats = geo.features.filter((f) => f.properties.FEATURECLA === "Admin-1 capital");

  /** @type {Record<string, {name:{zh:string,en:string},region:{zh:string,en:string},latlng:[number,number]}[]>} */
  const out = {};
  let kept = 0;
  const skippedNoZh = [];

  for (const f of feats) {
    const p = f.properties;
    const a3 = p.ADM0_A3;
    if (SKIP_A3.has(a3)) continue;
    const iso2 = iso3to2.get(a3);
    if (!iso2) continue; // 非主权属地/未收录：跳过
    if (curatedSet.has(iso2)) continue; // 精校国家优先，跳过 NE

    const nameEn = p.NAME_EN || p.NAME || p.NAMEASCII;
    const nameZh = p.NAME_ZH || nameEn; // NE 该图层 100% 有中文名；兜底用英文
    if (!nameZh) {
      skippedNoZh.push(nameEn);
      continue;
    }
    const regionEn = p.ADM1NAME || nameEn;
    const [lng, lat] = f.geometry.coordinates;

    (out[iso2] ||= []).push({
      name: { zh: nameZh, en: nameEn },
      region: { zh: regionEn, en: regionEn },
      latlng: [Math.round(lat * 1e4) / 1e4, Math.round(lng * 1e4) / 1e4],
    });
    kept++;
  }

  // 每国去重（按中文名）并限量
  for (const iso2 of Object.keys(out)) {
    const seen = new Set();
    const dedup = [];
    for (const c of out[iso2]) {
      if (seen.has(c.name.zh)) continue;
      seen.add(c.name.zh);
      dedup.push(c);
    }
    // 保序，仅在超限时截断
    out[iso2] = dedup.slice(0, MAX_PER_COUNTRY);
  }

  const withComment = {
    _comment:
      "全球一级行政区首府（省会/州府）打点，来源 Natural Earth 1:10m Populated Places（Admin-1 capital，简体中文名），public domain。台湾、中国大陆已排除；精校国家见 admin-capitals.json。由 scripts/build-admin-capitals.mjs 生成。",
    ...out,
  };
  await writeFile(OUT, JSON.stringify(withComment, null, 0));

  const nCountries = Object.keys(out).length;
  console.log(`✓ admin-capitals-global: ${nCountries} 国 / ${kept} 个省会（精校 ${curatedSet.size} 国另计）`);
  if (skippedNoZh.length) console.log(`  (跳过无中文名 ${skippedNoZh.length} 条)`);
}

main().catch((e) => {
  console.error("✗ 生成失败：", e);
  process.exit(1);
});
