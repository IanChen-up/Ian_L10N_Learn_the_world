/**
 * Atlas 站点计数服务（零依赖，Node 18+）
 * ------------------------------------------------------------
 * 作用：为纯静态前端提供「真实、免登录、可多次点赞」的浏览量与点赞计数。
 *      数据持久化到本地 JSON 文件（stats.json），重启不丢失。
 *
 * 为什么需要它：GitHub Pages / 宝塔静态站点本身不能存储计数。
 *      用一个极小的 Node 服务即可实现真实计数，且无需数据库。
 *
 * 接口（均返回 { views, likes }）：
 *   POST /view   —— 浏览量 +1（前端每次进入首页调用一次）
 *   POST /like   —— 点赞 +1（允许同一访客多次点击）
 *   GET  /       —— 只读当前计数
 *
 * 启动（本地测试）：
 *   PORT=8788 ALLOW_ORIGIN=https://your-domain.com node server/stats-server.mjs
 *
 * 前端对接：把 src/config/site.ts 的 STATS_API_URL 设为本服务对外地址，
 *          如 https://your-domain.com/api/stats
 */
import http from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8788);
const ALLOW_ORIGIN = process.env.ALLOW_ORIGIN || "*";
const DATA_FILE = process.env.STATS_FILE || join(__dirname, "stats.json");

let stats = { views: 0, likes: 0 };
let dirty = false;

async function load() {
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    const j = JSON.parse(raw);
    stats = { views: Number(j.views) || 0, likes: Number(j.likes) || 0 };
  } catch {
    // 文件不存在则从 0 开始
  }
}

// 每 5 秒落盘一次（合并高频写入，降低磁盘压力）
setInterval(async () => {
  if (!dirty) return;
  dirty = false;
  try {
    await writeFile(DATA_FILE, JSON.stringify(stats));
  } catch (e) {
    console.error("✗ 写入 stats.json 失败：", e.message);
  }
}, 5000);

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", ALLOW_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function sendJSON(res, code, body) {
  res.writeHead(code, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

const server = http.createServer((req, res) => {
  setCors(res);
  if (req.method === "OPTIONS") {
    res.writeHead(204).end();
    return;
  }

  const path = new URL(req.url, "http://localhost").pathname.replace(/\/+$/, "") || "/";

  if (req.method === "POST" && path === "/view") {
    stats.views += 1;
    dirty = true;
    return sendJSON(res, 200, stats);
  }
  if (req.method === "POST" && path === "/like") {
    stats.likes += 1;
    dirty = true;
    return sendJSON(res, 200, stats);
  }
  if (req.method === "GET" && path === "/") {
    return sendJSON(res, 200, stats);
  }
  sendJSON(res, 404, { error: "Not found" });
});

await load();
server.listen(PORT, () => {
  console.log(`✓ Atlas 计数服务已启动: http://127.0.0.1:${PORT}`);
  console.log(`  数据文件: ${DATA_FILE} · 当前 views=${stats.views} likes=${stats.likes}`);
});
