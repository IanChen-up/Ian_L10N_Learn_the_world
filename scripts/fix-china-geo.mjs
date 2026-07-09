/**
 * 修正 DataV 中国 GeoJSON 的环绕方向（winding order）。
 * DataV 数据外环方向与 d3-geo / RFC 7946 相反，导致每个多边形被当作
 * “取补集”覆盖几乎整个地球（geoArea≈4π），地图无法正常投影。
 *
 * 用 d3-geo 的球面 geoArea 判定：若某多边形面积 > 2π（半球），
 * 说明方向反了，翻转其所有环。幂等：正确数据再次运行不变。
 *
 * 运行：node scripts/fix-china-geo.mjs
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { geoArea } from "d3-geo";

const __dirname = dirname(fileURLToPath(import.meta.url));
const GEO = join(__dirname, "..", "public", "data", "china-provinces.json");

const HEMISPHERE = 2 * Math.PI;

/** 翻转单个多边形的所有环（外环 + 洞） */
function reversePolygon(rings) {
  rings.forEach((ring) => ring.reverse());
}

/** 若单个多边形方向反了（球面面积过大）则翻转 */
function fixPolygon(rings) {
  const poly = { type: "Polygon", coordinates: rings };
  if (geoArea(poly) > HEMISPHERE) reversePolygon(rings);
}

function fixGeometry(geom) {
  if (!geom) return;
  if (geom.type === "Polygon") {
    fixPolygon(geom.coordinates);
  } else if (geom.type === "MultiPolygon") {
    geom.coordinates.forEach((poly) => fixPolygon(poly));
  }
}

async function main() {
  const g = JSON.parse(await readFile(GEO, "utf8"));
  let fixed = 0;
  for (const f of g.features) {
    const before = f.geometry ? geoArea(f.geometry) : 0;
    fixGeometry(f.geometry);
    const after = f.geometry ? geoArea(f.geometry) : 0;
    if (before !== after) fixed++;
  }
  await writeFile(GEO, JSON.stringify(g));
  console.log(`✓ rewound ${fixed}/${g.features.length} features → china-provinces.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
