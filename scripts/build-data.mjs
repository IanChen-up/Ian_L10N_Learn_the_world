/**
 * 数据构建管道 · Atlas
 * 1. 拉取 world-countries（基础：国名/首都/货币/语言/地区/国旗/经纬度/ccn3）
 * 2. 拉取 world-atlas TopoJSON（世界地图矢量）
 * 3. 合并 scripts/sources/supplement.json（宗教/政体/独特假期/中文校正）
 * 4. 归一化输出 public/data/countries.json + 六维度倒排索引 + 地图
 *
 * 运行：node scripts/build-data.mjs
 */
import { writeFile, readFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "public", "data");

const WORLD_COUNTRIES = "https://cdn.jsdelivr.net/npm/world-countries@5.1.0/countries.json";
const WORLD_ATLAS = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";
// world-countries 不含 timezones/car/startOfWeek，从 REST Countries 免费镜像补齐（CORS 开放、已验证）
const REST_COUNTRIES = "https://studies.cs.helsinki.fi/restcountries/api/all";

/** CLDR：周日起始的地区（ISO3）。其余默认周一，伊斯兰国家见 SAT_START。 */
const SUN_START = new Set([
  "USA","CAN","MEX","BRA","COL","PER","VEN","PAN","JAM","DOM","GTM","HND","SLV","NIC","PRY",
  "JPN","KOR","TWN","HKG","MAC","IND","PAK","BGD","NPL","BTN","IDN","PHL","THA","LAO","SGP","MMR",
  "ISR","ZAF","ZWE","KEN","ETH","MOZ","BWA","ISL","MLT","PRT",
]);
/** CLDR：周六起始的地区（ISO3）。 */
const SAT_START = new Set([
  "AFG","DZA","BHR","DJI","EGY","IRN","IRQ","JOR","KWT","LBY","OMN","QAT","SDN","SYR",
]);

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed ${res.status}: ${url}`);
  return res.json();
}

/** 首都中文映射（补充 world-countries 未含的中文首都名） */
async function loadSupplement() {
  const raw = await readFile(join(__dirname, "sources", "supplement.json"), "utf8");
  return JSON.parse(raw);
}

async function loadJSONFile(name) {
  const raw = await readFile(join(__dirname, "sources", name), "utf8");
  return JSON.parse(raw);
}

/** 从 World Bank 拉取某指标全球所有国家的时间序列（分页），返回 iso3 -> [{year,value}]（按年份升序）。 */
async function fetchWorldBank(indicator, from, to) {
  const map = {};
  try {
    let page = 1;
    let pages = 1;
    do {
      const url = `https://api.worldbank.org/v2/country/all/indicator/${indicator}?date=${from}:${to}&format=json&per_page=20000&page=${page}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`WB ${res.status}`);
      const json = await res.json();
      const meta = json[0];
      const rows = json[1] || [];
      pages = meta?.pages || 1;
      for (const r of rows) {
        const iso3 = r.countryiso3code;
        if (!iso3 || iso3.length !== 3) continue; // 过滤地区聚合
        if (r.value == null) continue;
        (map[iso3] ||= []).push({ year: Number(r.date), value: r.value });
      }
      page += 1;
    } while (page <= pages);
    for (const iso3 of Object.keys(map)) map[iso3].sort((a, b) => a.year - b.year);
    return map;
  } catch (e) {
    console.warn(`⚠ World Bank 抓取失败 (${indicator})：`, e.message);
    return null;
  }
}

/** 从 REST Countries 镜像构建 cca3 → {timezones, drivingSide, startOfWeek} 映射 */
async function buildRestFacts() {
  try {
    const arr = await fetchJSON(REST_COUNTRIES);
    const map = {};
    for (const c of arr) {
      const iso3 = c.cca3;
      if (!iso3) continue;
      map[iso3] = {
        timezones: Array.isArray(c.timezones) ? c.timezones : undefined,
        drivingSide: c.car?.side === "left" || c.car?.side === "right" ? c.car.side : undefined,
        startOfWeek:
          c.startOfWeek === "monday" || c.startOfWeek === "sunday" || c.startOfWeek === "saturday"
            ? c.startOfWeek
            : undefined,
      };
    }
    return map;
  } catch (e) {
    console.warn("⚠ REST Countries 镜像抓取失败，将回退到 CLDR 周起始表并跳过时区/驾驶方向：", e.message);
    return null;
  }
}

function pickLanguages(langObj) {
  // world-countries languages: { jpn: "Japanese", ... }
  return Object.entries(langObj || {}).map(([code, name]) => ({
    code,
    name: localizedDisplayName("language", code, String(name)),
  }));
}

function pickCurrency(curObj) {
  const entries = Object.entries(curObj || {});
  if (!entries.length) {
    return { code: "N/A", symbol: "", name: { zh: "无", en: "None" } };
  }
  const [code, info] = entries[0];
  return {
    code,
    symbol: info.symbol || "",
    name: localizedDisplayName("currency", code, info.name),
  };
}

/** 站内数据字段支持的语言。 */
const DATA_LOCALES = ["zh", "zh-Hant", "en", "ja", "ko", "ar", "fr", "ru", "es"];

/** Intl.DisplayNames 基于 CLDR，可权威生成语言名/货币名等本地化展示名。 */
function localizedDisplayName(type, code, fallback) {
  const out = { en: fallback };
  for (const locale of DATA_LOCALES) {
    try {
      const name = new Intl.DisplayNames([locale], { type }).of(code);
      if (name) out[locale] = name;
    } catch {
      // 某些异常码保留回退值
    }
  }
  if (!out.zh) out.zh = fallback;
  return out;
}

const REGION_KEY = {
  Africa: "africa",
  Americas: "americas",
  Asia: "asia",
  Europe: "europe",
  Oceania: "oceania",
  Antarctic: "antarctic",
};

/**
 * 政治表述校正（面向中国大陆用户，采用官方/中性表述）。
 * 以 ISO3 为键覆盖 government 字段。
 */
const GOVERNMENT_OVERRIDES = {
  CHN: "socialist_republic", // 社会主义国家（统一表述，面向大陆用户）
  VNM: "socialist_republic",
  LAO: "socialist_republic",
  CUB: "socialist_republic",
  PRK: "socialist_republic",
  ERI: "presidential_republic",
};

/**
 * 首都表述校正（面向中国大陆用户，采用中国官方/中性立场）。
 * 以 ISO3 为键覆盖首都。以色列首都按中国立场与国际惯例记为特拉维夫；
 * 耶路撒冷地位未定，不作为以色列首都展示。
 */
const CAPITAL_OVERRIDES = {
  ISR: { zh: "特拉维夫", en: "Tel Aviv" },
};

/** world-countries translations 语言键 → 站内 locale 键。 */
const NAME_TRANS = {
  jpn: "ja",
  kor: "ko",
  ara: "ar",
  fra: "fr",
  rus: "ru",
  spa: "es",
};

/** 构建国家多语言名称：zh/en 保底，其余从 world-countries translations 补齐。 */
function buildName(c, extra) {
  const name = {
    zh: c.translations?.zho?.common || extra?.name?.zh || c.name.common,
    en: c.name.common,
  };
  for (const [src, loc] of Object.entries(NAME_TRANS)) {
    const v = c.translations?.[src]?.common;
    if (v) name[loc] = v;
  }
  // CLDR 区域名补齐缺口，尤其是 zh-Hant（繁体中文）。
  for (const locale of DATA_LOCALES) {
    if (name[locale]) continue;
    try {
      const v = new Intl.DisplayNames([locale], { type: "region" }).of(c.cca2);
      if (v) name[locale] = v;
    } catch {
      // 保留回退链
    }
  }
  // 繁体：补充数据可覆盖 CLDR 区域名。
  if (extra?.nameHant) name["zh-Hant"] = extra.nameHant;
  return name;
}

/** 构建首都多语言名称：zh/en 保底 + 覆盖，其余语言由补充数据(capitalI18n)按需补齐。 */
function buildCapital(capitalEn, capOverride, extra, generatedI18n) {
  const cap = {
    zh: capOverride?.zh || extra?.capital?.zh || capitalEn || "—",
    en: capOverride?.en || capitalEn || "—",
  };
  const i18n = { ...(generatedI18n || {}), ...(extra?.capitalI18n || {}) };
  if (i18n && typeof i18n === "object") {
    for (const [k, v] of Object.entries(i18n)) {
      if (v) cap[k] = v;
    }
  }
  return cap;
}

async function main() {
  console.log("→ fetching base datasets…");
  const [rawCountries, atlas, supplement, geoFacts, langMeta, restFacts, funMetrics, gdpHist, femalePct, holidaysExtra, passportMetrics, langPhrases, adminCapitals, adminCapitalsGlobal, capitalI18n, lifeExp] =
    await Promise.all([
      fetchJSON(WORLD_COUNTRIES),
      fetchJSON(WORLD_ATLAS),
      loadSupplement(),
      loadJSONFile("geo-facts.json"),
      loadJSONFile("language-meta.json"),
      buildRestFacts(),
      loadJSONFile("fun-metrics.json"),
      fetchWorldBank("NY.GDP.MKTP.CD", 1974, 2024),
      fetchWorldBank("SP.POP.TOTL.FE.ZS", 2020, 2024),
      loadJSONFile("holidays-extra.json").catch(() => ({})),
      loadJSONFile("passport-metrics.json").catch(() => ({})),
      loadJSONFile("lang-phrases.json").catch(() => ({})),
      loadJSONFile("admin-capitals.json").catch(() => ({})),
      loadJSONFile("admin-capitals-global.json").catch(() => ({})),
      loadJSONFile("capital-i18n.json").catch(() => ({})),
      fetchWorldBank("SP.DYN.LE00.IN", 2019, 2023),
    ]);

  const sup = supplement.countries || {};
  const langZh = supplement.languageNames?.zh || {};
  const curZh = supplement.currencyNames?.zh || {};
  const electricityMap = geoFacts.electricity || {};
  const measurementExc = geoFacts.measurementExceptions || {};

  /** 合并补充假期与扩展假期（holidays-extra.json），按英文名去重，扩展项补在后面。 */
  const mergeHolidays = (iso3) => {
    const base = Array.isArray(sup[iso3]?.holidays) ? sup[iso3].holidays : [];
    const extra = Array.isArray(holidaysExtra?.[iso3]) ? holidaysExtra[iso3] : [];
    const seen = new Set(base.map((h) => (h?.name?.en || "").toLowerCase().trim()));
    const merged = [...base];
    for (const h of extra) {
      const key = (h?.name?.en || "").toLowerCase().trim();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      merged.push(h);
    }
    return merged;
  };

  /** 计算一周起始日：优先 REST Countries，其次 CLDR 集合，默认 monday */
  const weekStart = (iso3, rest) => {
    if (rest?.startOfWeek) return rest.startOfWeek;
    if (SAT_START.has(iso3)) return "saturday";
    if (SUN_START.has(iso3)) return "sunday";
    return "monday";
  };

  // 仅保留联合国会员国或独立国家（≈194），保证数据质量
  const filtered = rawCountries.filter((c) => c.unMember || c.independent);

  /** @type {any[]} */
  const countries = [];
  const missingSupplement = [];

  for (const c of filtered) {
    const iso = c.cca2;
    const iso3 = c.cca3;
    const extra = sup[iso3] || sup[iso] || null;
    if (!extra) missingSupplement.push(`${iso3} ${c.name.common}`);

    const languages = pickLanguages(c.languages).map((l) => ({
      code: l.code,
      name: { ...l.name, zh: langZh[l.code] || l.name.zh || l.name.en },
    }));

    const currency = pickCurrency(c.currencies);
    if (curZh[currency.code]) currency.name.zh = curZh[currency.code];

    const capitalEn = (c.capital && c.capital[0]) || "";
    const capOverride = CAPITAL_OVERRIDES[iso3];
    const idd =
      c.idd && c.idd.root
        ? `${c.idd.root}${(c.idd.suffixes && c.idd.suffixes.length === 1 && c.idd.suffixes[0]) || ""}`
        : "";
    const country = {
      iso,
      iso3,
      ccn3: c.ccn3,
      name: buildName(c, extra),
      capital: buildCapital(capitalEn, capOverride, extra, capitalI18n?.[iso]),
      region: REGION_KEY[c.region] || "other",
      subregion: c.subregion || "",
      flag: c.flag || "🏳️",
      latlng: c.latlng,
      area: c.area || 0,
      landlocked: Boolean(c.landlocked),
      callingCode: idd,
      tld: (c.tld && c.tld[0]) || "",
      borders: c.borders || [],
      population: extra?.population ?? null,
      gdp: extra?.gdp ?? null,
      currency,
      languages,
      religions: extra?.religions || [],
      government: GOVERNMENT_OVERRIDES[iso3] || extra?.government || "other",
      holidays: mergeHolidays(iso3),
      timezones: restFacts?.[iso3]?.timezones,
      drivingSide: restFacts?.[iso3]?.drivingSide,
      startOfWeek: weekStart(iso3, restFacts?.[iso3]),
      measurement: measurementExc[iso3] || "metric",
      electricity: electricityMap[iso3] || undefined,
    };
    // World Bank：用最新一年 GDP 覆盖并记录年份；补充女性人口占比
    const gh = gdpHist?.[iso3];
    if (gh && gh.length) {
      const latest = gh[gh.length - 1];
      country.gdp = latest.value;
      country.gdpYear = latest.year;
    }
    const fp = femalePct?.[iso3];
    if (fp && fp.length) {
      const femaleShare = Math.round(fp[fp.length - 1].value * 10) / 10;
      country.femaleShare = femaleShare;
      // 男女比例：每 100 名女性对应的男性数（= 男性% / 女性% * 100）
      if (femaleShare > 0 && femaleShare < 100) {
        country.sexRatio = Math.round(((100 - femaleShare) / femaleShare) * 100 * 10) / 10;
      }
    }
    // 护照免签目的地数 & 互联网普及率（公开数据）
    if (passportMetrics.visaFree?.[iso3] != null) country.visaFree = passportMetrics.visaFree[iso3];
    if (passportMetrics.internetPct?.[iso3] != null) country.internetPct = passportMetrics.internetPct[iso3];
    // 平均预期寿命（World Bank，最新一年）
    const le = lifeExp?.[iso3];
    if (le && le.length) country.lifeExpectancy = Math.round(le[le.length - 1].value * 10) / 10;
    // 人口密度（人/km²，由人口与面积派生）
    if (country.population != null && country.area > 0) {
      country.density = Math.round((country.population / country.area) * 10) / 10;
    }
    countries.push(country);
  }

  countries.sort((a, b) => a.name.en.localeCompare(b.name.en));

  // ---- 全球排名（GDP、面积、人口）----
  const gdpRanked = [...countries].filter((c) => c.gdp != null).sort((a, b) => b.gdp - a.gdp);
  gdpRanked.forEach((c, i) => (c.gdpRank = i + 1));
  const areaRanked = [...countries].filter((c) => c.area > 0).sort((a, b) => b.area - a.area);
  areaRanked.forEach((c, i) => (c.areaRank = i + 1));
  const popRanked = [...countries].filter((c) => c.population != null).sort((a, b) => b.population - a.population);
  popRanked.forEach((c, i) => (c.populationRank = i + 1));

  // ---- 构建可反向筛选的维度倒排索引 ----
  // 说明：holiday/capital 对反向筛选无意义（几乎一国一值），
  // 故不生成其索引；改以 region 作为可浏览维度。
  // 六大知识维度仍在国家详情面板完整展示。
  /** @type {Record<string, any>} */
  const indexes = {
    currency: {},
    language: {},
    religion: {},
    government: {},
    region: {},
  };

  const addEntry = (dim, value, label, iso) => {
    if (!value) return;
    const bucket = indexes[dim];
    if (!bucket[value]) bucket[value] = { value, label, countries: [] };
    if (!bucket[value].countries.includes(iso)) bucket[value].countries.push(iso);
  };

  for (const c of countries) {
    addEntry("currency", c.currency.code, c.currency.name, c.iso);
    for (const l of c.languages) addEntry("language", l.code, l.name, c.iso);
    for (const r of c.religions) addEntry("religion", r.key, undefined, c.iso);
    addEntry("government", c.government, undefined, c.iso);
    addEntry("region", c.region, undefined, c.iso);
  }

  await mkdir(OUT, { recursive: true });
  await writeFile(join(OUT, "countries.json"), JSON.stringify(countries));
  for (const dim of Object.keys(indexes)) {
    await writeFile(join(OUT, `index.${dim}.json`), JSON.stringify(indexes[dim]));
  }
  await writeFile(join(OUT, "world-atlas.json"), JSON.stringify(atlas));
  // 语言语言学元信息（语系/文字/声调/人数），供语言维度展示
  await writeFile(join(OUT, "language-meta.json"), JSON.stringify(langMeta.languages || {}));

  // ---- 有趣指标 & 历史维度：iso3 → iso2 映射后输出 insights.json ----
  const iso3to2 = new Map(countries.map((c) => [c.iso3, c.iso]));
  const map3 = (iso3) => iso3to2.get(iso3) || null;
  const mapValues = (obj) => {
    const out = {};
    for (const [iso3, v] of Object.entries(obj || {})) {
      const iso2 = map3(iso3);
      if (iso2) out[iso2] = v;
    }
    return out;
  };
  const mapList = (arr) => (arr || []).map(map3).filter(Boolean);

  const insights = {
    measurement: {}, // metric / imperial / mixed → iso2[]
    female: mapValues(Object.fromEntries(countries.filter((c) => c.femaleShare != null).map((c) => [c.iso3, c.femaleShare]))),
    sexRatio: Object.fromEntries(countries.filter((c) => c.sexRatio != null).map((c) => [c.iso, c.sexRatio])),
    visaFree: Object.fromEntries(countries.filter((c) => c.visaFree != null).map((c) => [c.iso, c.visaFree])),
    internetPct: Object.fromEntries(countries.filter((c) => c.internetPct != null).map((c) => [c.iso, c.internetPct])),
    lifeExpectancy: Object.fromEntries(countries.filter((c) => c.lifeExpectancy != null).map((c) => [c.iso, c.lifeExpectancy])),
    density: Object.fromEntries(countries.filter((c) => c.density != null).map((c) => [c.iso, c.density])),
    nobel: mapValues(funMetrics.nobel),
    fortune500: mapValues(funMetrics.fortune500),
    worldCup: mapValues(funMetrics.worldCup),
    peaceIndex: mapValues(funMetrics.peaceIndex),
    mostPeaceful: mapList(funMetrics.mostPeaceful),
    ww1: { allied: mapList(funMetrics.ww1.allied), central: mapList(funMetrics.ww1.central) },
    ww2: { allied: mapList(funMetrics.ww2.allied), axis: mapList(funMetrics.ww2.axis) },
  };
  for (const c of countries) {
    (insights.measurement[c.measurement] ||= []).push(c.iso);
  }
  await writeFile(join(OUT, "insights.json"), JSON.stringify(insights));

  // 语言 → 语系 索引（供"按语系筛选"）：从 language-meta 取 family.en 作分组 key。
  // 每个语系聚合使用该语系语言的国家 iso2。
  const langMetaMap = langMeta.languages || {};
  const familyIndex = {};
  for (const c of countries) {
    const seen = new Set();
    for (const l of c.languages) {
      const meta = langMetaMap[l.code];
      if (!meta) continue;
      const famEn = meta.family.en;
      if (seen.has(famEn)) continue;
      seen.add(famEn);
      if (!familyIndex[famEn]) familyIndex[famEn] = { label: meta.family, countries: [] };
      if (!familyIndex[famEn].countries.includes(c.iso)) familyIndex[famEn].countries.push(c.iso);
    }
  }
  await writeFile(join(OUT, "language-families.json"), JSON.stringify(familyIndex));

  // 按语言复用的常用语库（供小语种国家显示哈喽/谢谢等）
  await writeFile(join(OUT, "lang-phrases.json"), JSON.stringify(langPhrases.phrases || {}));

  // 全球一级行政区首府（省会/州府）打点，供地图开关叠加。
  // 合并策略：手工精校（admin-capitals.json）优先，其余国家用 Natural Earth 全球集补齐。
  {
    const mergedAdmin = {};
    for (const [k, v] of Object.entries(adminCapitalsGlobal || {})) {
      if (k === "_comment") continue;
      mergedAdmin[k] = v;
    }
    for (const [k, v] of Object.entries(adminCapitals || {})) {
      if (k === "_comment") continue;
      mergedAdmin[k] = v; // 精校覆盖
    }
    await writeFile(join(OUT, "admin-capitals.json"), JSON.stringify(mergedAdmin));
  }

  // GDP 历史（近 50 年）：iso2 → [{year,value}]，供国家详情走势图
  if (gdpHist) {
    const gdpOut = {};
    for (const c of countries) {
      const gh = gdpHist[c.iso3];
      if (gh && gh.length) gdpOut[c.iso] = gh;
    }
    await writeFile(join(OUT, "gdp-history.json"), JSON.stringify(gdpOut));
  }

  // 元信息
  await writeFile(
    join(OUT, "meta.json"),
    JSON.stringify({
      generatedAt: new Date().toISOString().slice(0, 10),
      countryCount: countries.length,
      dimensions: Object.fromEntries(
        Object.entries(indexes).map(([k, v]) => [k, Object.keys(v).length])
      ),
    })
  );

  console.log(`✓ countries: ${countries.length}`);
  console.log(
    `✓ index sizes:`,
    Object.fromEntries(Object.entries(indexes).map(([k, v]) => [k, Object.keys(v).length]))
  );
  if (missingSupplement.length) {
    console.log(`⚠ missing supplement (${missingSupplement.length}):`, missingSupplement.slice(0, 30).join(", "));
  } else {
    console.log("✓ all countries have supplement data");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
