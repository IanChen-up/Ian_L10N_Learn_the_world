/**
 * Atlas 试用代理（零依赖，Node 18+）
 * ------------------------------------------------------------
 * 作用：持有真正的 API Key（存于环境变量，绝不下发到浏览器），
 *      对匿名访客做「每 IP 每天 N 次」限流，并把上游 OpenAI 兼容
 *      的 SSE 流原样转发给前端。前端只知道本代理地址，拿不到 Key。
 *
 * 为什么需要它：纯静态前端无法真正隐藏密钥。要实现「预填充试用、
 *      不暴露、限 3 次不可绕过」，必须由服务端持钥并限流。
 *
 * 启动（本地测试）：
 *   TRIAL_API_KEY=sk-xxx \
 *   TRIAL_BASE_URL=https://api.deepseek.com/v1 \
 *   TRIAL_MODEL=deepseek-chat \
 *   TRIAL_LIMIT=3 \
 *   ALLOW_ORIGIN=https://your-domain.com \
 *   node server/trial-proxy.mjs
 *
 * 前端对接：把 src/config/site.ts 的 TRIAL_PROXY_URL 设为本服务对外地址，
 *          如 https://your-domain.com/api/trial
 */
import http from "node:http";
import https from "node:https";
import { URL } from "node:url";

const PORT = Number(process.env.PORT || 8787);
const API_KEY = process.env.TRIAL_API_KEY || "";
const BASE_URL = (process.env.TRIAL_BASE_URL || "https://api.deepseek.com/v1").replace(/\/+$/, "");
const MODEL = process.env.TRIAL_MODEL || "deepseek-chat";
const LIMIT = Number(process.env.TRIAL_LIMIT || 3);
const ALLOW_ORIGIN = process.env.ALLOW_ORIGIN || "*";
const MAX_BODY = 32 * 1024; // 32KB，防滥用

if (!API_KEY) {
  console.error("✗ 未设置 TRIAL_API_KEY 环境变量，拒绝启动。");
  process.exit(1);
}

// 内存限流表：ip -> { count, day }。生产可换 Redis；单机每日重置足够。
const usage = new Map();
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function getClientIp(req) {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.length) return xff.split(",")[0].trim();
  return req.socket.remoteAddress || "unknown";
}
function checkAndCount(ip) {
  const day = todayStr();
  const rec = usage.get(ip);
  if (!rec || rec.day !== day) {
    usage.set(ip, { count: 1, day });
    return { ok: true, remaining: LIMIT - 1 };
  }
  if (rec.count >= LIMIT) return { ok: false, remaining: 0 };
  rec.count += 1;
  return { ok: true, remaining: LIMIT - rec.count };
}

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", ALLOW_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

const server = http.createServer((req, res) => {
  setCors(res);

  if (req.method === "OPTIONS") {
    res.writeHead(204).end();
    return;
  }
  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  const ip = getClientIp(req);
  const gate = checkAndCount(ip);
  if (!gate.ok) {
    // 前端约定：429 表示试用已用完
    res.writeHead(429, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "TRIAL_EXCEEDED" }));
    return;
  }

  let body = "";
  let tooLarge = false;
  req.on("data", (chunk) => {
    body += chunk;
    if (body.length > MAX_BODY) {
      tooLarge = true;
      req.destroy();
    }
  });
  req.on("end", () => {
    if (tooLarge) {
      res.writeHead(413, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Payload too large" }));
      return;
    }
    let messages;
    try {
      const parsed = JSON.parse(body || "{}");
      messages = parsed.messages;
      if (!Array.isArray(messages) || messages.length === 0) throw new Error("no messages");
    } catch {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid body" }));
      return;
    }

    const upstreamUrl = new URL(`${BASE_URL}/chat/completions`);
    const payload = JSON.stringify({ model: MODEL, messages, stream: true, temperature: 0.6 });

    const upstreamReq = https.request(
      upstreamUrl,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (upstreamRes) => {
        if ((upstreamRes.statusCode || 500) >= 400) {
          let errText = "";
          upstreamRes.on("data", (d) => (errText += d));
          upstreamRes.on("end", () => {
            res.writeHead(502, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Upstream error", detail: errText.slice(0, 300) }));
          });
          return;
        }
        res.writeHead(200, {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "X-Trial-Remaining": String(gate.remaining),
        });
        upstreamRes.pipe(res);
      }
    );

    upstreamReq.on("error", (e) => {
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Upstream request failed", detail: String(e.message) }));
    });
    upstreamReq.write(payload);
    upstreamReq.end();
  });
});

server.listen(PORT, () => {
  console.log(`✓ Atlas 试用代理已启动: http://127.0.0.1:${PORT}`);
  console.log(`  上游: ${BASE_URL} · 模型: ${MODEL} · 每 IP 每日 ${LIMIT} 次`);
});
