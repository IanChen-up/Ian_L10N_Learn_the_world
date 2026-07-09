/**
 * 生成首都多语言名称 · Atlas
 *
 * 数据源：Wikidata SPARQL
 * - 国家 ISO2：P297
 * - 首都：P36
 * - 首都多语言 label：ja/ko/ar/fr/ru/es/zh-Hant
 *
 * 输出：scripts/sources/capital-i18n.json
 * 运行：node scripts/build-capital-i18n.mjs
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(__dirname, "sources", "capital-i18n.json");

const LABELS = {
  "zh-Hant": "capital_zhHant",
  ja: "capital_ja",
  ko: "capital_ko",
  ar: "capital_ar",
  fr: "capital_fr",
  ru: "capital_ru",
  es: "capital_es",
};

async function main() {
  const countries = JSON.parse(await readFile(join(ROOT, "public", "data", "countries.json"), "utf8"));
  const iso2Set = new Set(countries.map((c) => c.iso));

  const optionalLabels = Object.entries(LABELS)
    .map(
      ([lang, varName]) =>
        `OPTIONAL { ?capital rdfs:label ?${varName} FILTER(LANG(?${varName})="${lang}") }`
    )
    .join("\n");

  const query = `
SELECT ?iso2 ?capital ${Object.values(LABELS).map((v) => `?${v}`).join(" ")} WHERE {
  ?country wdt:P297 ?iso2 ;
           wdt:P36 ?capital .
  ${optionalLabels}
}
`;

  const url = `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { "User-Agent": "Atlas-localization/1.0" } });
  if (!res.ok) throw new Error(`Wikidata SPARQL failed: ${res.status}`);
  const data = await res.json();

  const out = {};
  for (const row of data.results.bindings) {
    const iso2 = row.iso2?.value;
    if (!iso2Set.has(iso2)) continue;
    const item = {};
    for (const [locale, varName] of Object.entries(LABELS)) {
      const value = row[varName]?.value;
      if (value) item[locale] = value;
    }
    if (Object.keys(item).length) out[iso2] = item;
  }

  // 中国立场/既有约定：以色列首都展示为特拉维夫，不使用耶路撒冷。
  out.IL = {
    "zh-Hant": "特拉維夫",
    ja: "テルアビブ",
    ko: "텔아비브",
    ar: "تل أبيب",
    fr: "Tel Aviv",
    ru: "Тель-Авив",
    es: "Tel Aviv",
  };

  await writeFile(
    OUT,
    JSON.stringify(
      {
        _comment:
          "首都多语言名称，来源 Wikidata P36/P297 + rdfs:label。以色列按站内政治合规覆盖为特拉维夫。由 scripts/build-capital-i18n.mjs 生成。",
        ...out,
      },
      null,
      0
    )
  );
  console.log(`✓ capital-i18n: ${Object.keys(out).length} countries`);
}

main().catch((e) => {
  console.error("✗ capital-i18n 生成失败：", e);
  process.exit(1);
});
