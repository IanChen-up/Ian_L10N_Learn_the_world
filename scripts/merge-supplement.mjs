/**
 * 合并各区域补充数据 + 语言/货币中文名 → supplement.json
 * 运行：node scripts/merge-supplement.mjs
 */
import { writeFile, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dirname, "sources");

const REGIONS = ["Asia", "Europe", "Africa", "Americas", "Oceania"];

async function readJSON(p) {
  return JSON.parse(await readFile(p, "utf8"));
}

async function main() {
  const countries = {};
  for (const r of REGIONS) {
    const part = await readJSON(join(SRC, "parts", `supplement.${r}.json`));
    for (const [iso3, data] of Object.entries(part)) {
      // capitalZh → capital.zh 结构对齐 build-data 期望
      const entry = { ...data };
      if (data.capitalZh) {
        entry.capital = { zh: data.capitalZh };
        delete entry.capitalZh;
      }
      countries[iso3] = entry;
    }
  }

  // 统计数据（人口/GDP），可选文件
  try {
    const stats = await readJSON(join(SRC, "stats.json"));
    for (const [iso3, s] of Object.entries(stats)) {
      if (!countries[iso3]) countries[iso3] = {};
      if (s.population != null) countries[iso3].population = s.population;
      if (s.gdp != null) countries[iso3].gdp = s.gdp;
    }
  } catch {
    console.log("(stats.json 不存在，跳过人口/GDP)");
  }

  const langZh = await readJSON(join(SRC, "lang-zh.json"));
  const currencyZh = await readJSON(join(SRC, "currency-zh.json"));

  const supplement = {
    languageNames: { zh: langZh },
    currencyNames: { zh: currencyZh },
    countries,
  };

  await writeFile(join(SRC, "supplement.json"), JSON.stringify(supplement, null, 0));
  console.log(`✓ merged supplement: ${Object.keys(countries).length} countries, ${Object.keys(langZh).length} langs, ${Object.keys(currencyZh).length} currencies`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
