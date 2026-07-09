/**
 * 生成国家档案索引 public/data/profiles/index.json
 * 扫描 profiles 目录下所有 {ISO}.json（排除 index.json），
 * 并校验每个文件可被 JSON 解析。
 * 运行：node scripts/build-profiles-index.mjs
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIR = join(__dirname, "..", "public", "data", "profiles");

async function main() {
  const files = (await readdir(DIR)).filter(
    (f) => f.endsWith(".json") && f !== "index.json"
  );
  const index = {};
  const bad = [];
  for (const f of files) {
    const iso = f.replace(/\.json$/, "");
    try {
      JSON.parse(await readFile(join(DIR, f), "utf8"));
      index[iso] = true;
    } catch (e) {
      bad.push(`${f}: ${e.message}`);
    }
  }
  await writeFile(join(DIR, "index.json"), JSON.stringify(index));
  console.log(`✓ profiles index: ${Object.keys(index).length} countries`);
  if (bad.length) {
    console.log(`⚠ invalid JSON (${bad.length}):`);
    bad.forEach((b) => console.log("  " + b));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
