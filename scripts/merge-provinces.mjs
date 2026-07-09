/**
 * 合并中国省级数据分片 → public/data/cn-provinces.json
 * 数据键需与 china-provinces.json 地图要素 properties.name 完全一致。
 * 运行：node scripts/merge-provinces.mjs
 */
import { writeFile, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dirname, "sources");
const OUT = join(__dirname, "..", "public", "data");
const GEO = join(OUT, "china-provinces.json");

const PARTS = ["cn-provinces-1.json", "cn-provinces-2.json"];

async function readJSON(p) {
  return JSON.parse(await readFile(p, "utf8"));
}

async function main() {
  const merged = {};
  for (const part of PARTS) {
    const data = await readJSON(join(SRC, part));
    Object.assign(merged, data);
  }

  for (const p of Object.values(merged)) {
    if (p.gdpCNY != null && !p.gdpYear) p.gdpYear = 2022;
    if (p.gdpCNY != null && !p.gdpSource) {
      p.gdpSource = {
        label: {
          zh: "GDP 数据来源：中国国家统计局及各省级统计公报整理；单位为亿元人民币。历史序列待接入可稳定访问的官方接口后上线。",
          en: "GDP source: compiled from China's National Bureau of Statistics and provincial statistical communiqués; unit: 100 million CNY. Historical series will be added once a stable official endpoint is available.",
        },
        url: "https://data.stats.gov.cn/",
      };
    }
  }

  // 校验：数据键须覆盖地图要素 name（南海诸岛标记要素无 name，跳过）
  const geo = await readJSON(GEO);
  const geoNames = geo.features
    .map((f) => f.properties.name)
    .filter((n) => n && n.trim());
  const missing = geoNames.filter((n) => !(n in merged));
  const extra = Object.keys(merged).filter((n) => !geoNames.includes(n));

  await writeFile(join(OUT, "cn-provinces.json"), JSON.stringify(merged));
  console.log(`✓ cn-provinces: ${Object.keys(merged).length} regions (named map features: ${geoNames.length})`);
  if (missing.length) console.log(`⚠ 地图有但数据缺失：${missing.join(", ")}`);
  if (extra.length) console.log(`⚠ 数据有但地图缺失：${extra.join(", ")}`);
  if (!missing.length && !extra.length) console.log("✓ 数据与地图要素完全对应");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
