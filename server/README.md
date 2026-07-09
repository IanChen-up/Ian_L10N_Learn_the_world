# Atlas 部署指南（宝塔面板）

本项目 = **纯静态前端**（`dist/`）+ **可选的试用代理**（`server/trial-proxy.mjs`）。
下面按「先上线静态站，再按需加试用代理」两步走，都在宝塔里操作，方便管理。

---

## 一、构建前端

在你本地（有 Node 18+ 的机器）执行：

```bash
npm install
npm run data     # 拉取并生成 public/data/*（首次或数据更新时跑）
npm run build    # 产物输出到 dist/
```

把整个 `dist/` 目录打包上传到服务器即可（下一步）。

> 说明：`vite.config.ts` 里 `base: "./"` 用的是相对路径，放在任意目录/子路径都能跑。

---

## 二、宝塔部署静态站点

1. 宝塔 → **网站 → 添加站点**：填你的域名，PHP 选「纯静态」。
2. 把本地 `dist/` 里的**所有文件**上传到该站点根目录（如 `/www/wwwroot/atlas`）。
3. 因为用的是 **HashRouter**（URL 带 `#`），无需额外的伪静态/history 回退配置，刷新不会 404。
4. 在宝塔为站点**申请 SSL**（Let's Encrypt 免费证书），强制 HTTPS。

到这里，网站已经可以访问了。AI 功能此时走「用户自带 Key（BYOK）」，无需后端。

---

## 三、（可选）部署试用代理，实现「预填充试用 3 次」

> 只有需要「访客不填 Key 也能免费试用 N 次、且不暴露你的密钥」时才需要这步。
> 原理：密钥存在**服务器环境变量**里，浏览器永远拿不到；限流在服务端，清缓存也绕不过。

### 3.1 上传代理并配 Node 项目

1. 把 `server/trial-proxy.mjs` 上传到服务器，例如 `/www/wwwroot/atlas-proxy/trial-proxy.mjs`。
2. 宝塔 → **软件商店** 安装「**Node.js 版本管理器**」，装一个 Node 18+。
3. 宝塔 → **网站 → Node 项目 → 添加 Node 项目**：
   - 运行目录：`/www/wwwroot/atlas-proxy`
   - 启动文件/命令：`node trial-proxy.mjs`
   - 端口：`8787`
   - **添加环境变量**（关键，密钥只在这里）：
     ```
     TRIAL_API_KEY   = 你的真实API密钥（如 DeepSeek 的 sk-xxx）
     TRIAL_BASE_URL  = https://api.deepseek.com/v1
     TRIAL_MODEL     = deepseek-chat
     TRIAL_LIMIT     = 3
     ALLOW_ORIGIN    = https://你的域名
     PORT            = 8787
     ```
4. 保存并启动。宝塔会用它的守护进程（PM2）保活。

### 3.2 用 Nginx 反代把 `/api/trial` 指到代理

给**前端站点**加反向代理（宝塔 → 站点 → 反向代理，或直接改站点 Nginx 配置）：

```nginx
location /api/trial {
    proxy_pass http://127.0.0.1:8787;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $remote_addr;   # 让代理拿到真实 IP 做限流
    proxy_buffering off;                              # 关键：SSE 流式不缓冲
    proxy_cache off;
    chunked_transfer_encoding on;
}
```

> `proxy_buffering off` 必须加，否则 AI 回答不会「一个字一个字」流式出现。

### 3.3 前端开启试用入口

编辑 `src/config/site.ts`：

```ts
export const TRIAL_PROXY_URL = "https://你的域名/api/trial";
export const TRIAL_LIMIT = 3;
```

重新 `npm run build` 并上传 `dist/`。此后访客无需填 Key 即可试用；用满 3 次后，
AI 会回复「🥺 开发者钱包瘪瘪…」提示改用自己的 Key。

---

## 四、页脚打赏按钮（Buy Me a Coffee）

编辑 `src/config/site.ts` 的 `COFFEE_URL`，填第三方打赏平台链接（推荐**爱发电**，
如 `https://afdian.com/a/你的用户名`）。留空则套餐弹窗仍会展示搞笑表情反馈，只是隐藏"去支持"跳转按钮。
**不要**直接放个人收款码，用平台链接可隐藏你的收款信息、避免骚扰。

> 点击页脚"Buy Me a Coffee"会弹出 1/3/5/10/20/>20 元的搞笑套餐；选套餐先弹表情反馈，
> 再引导跳转到 `COFFEE_URL`。套餐文案与表情在 `src/data/coffeeTiers.ts` 里，可随时改。

---

## 五、（可选）部署点赞 / 浏览量计数服务

> 需要"真实、免登录、可多次点赞、显示总浏览量"时才需要这步。
> 原理：一个极小的零依赖 Node 服务把计数持久化到本地 `stats.json`，无需数据库。

### 5.1 上传并配 Node 项目

1. 把 `server/stats-server.mjs` 上传到服务器，例如 `/www/wwwroot/atlas-stats/stats-server.mjs`。
2. 宝塔 → **网站 → Node 项目 → 添加 Node 项目**：
   - 运行目录：`/www/wwwroot/atlas-stats`
   - 启动命令：`node stats-server.mjs`
   - 端口：`8788`
   - 环境变量：
     ```
     PORT         = 8788
     ALLOW_ORIGIN = https://你的域名
     ```
3. 保存并启动（PM2 保活）。计数会每 5 秒落盘到同目录 `stats.json`。

### 5.2 Nginx 反代 `/api/stats`

```nginx
location /api/stats {
    proxy_pass http://127.0.0.1:8788;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $remote_addr;
}
```

### 5.3 前端开启计数

编辑 `src/config/site.ts`：

```ts
export const STATS_API_URL = "https://你的域名/api/stats";
```

重新 `npm run build` 并上传 `dist/`。此后页脚会显示真实浏览量与点赞数；
`STATS_API_URL` 留空时页脚自动隐藏这两个数字（纯静态、不显示假数据）。

---

## 六、联系方式与模型署名

- 页脚"联系我"按钮点击复制邮箱，改 `src/config/site.ts` 的 `CONTACT_EMAIL`。
- 创建人一栏的"驱动模型"署名改 `MODEL_CREDIT`（默认 `Openrouter-3o`）。

---

## 七、日常维护清单

| 操作 | 怎么做 |
|---|---|
| 更新网站内容 | 本地 `npm run build` → 覆盖上传 `dist/` |
| 更新国家数据 | 本地 `npm run data && npm run build` → 上传 `dist/` |
| 换试用模型/额度 | 宝塔 Node 项目里改环境变量 → 重启 |
| 换/停用试用密钥 | 改 `TRIAL_API_KEY` 或停用 Node 项目即可 |
| 看代理/计数日志 | 宝塔对应 Node 项目 → 日志 |
| 备份点赞浏览数据 | 备份 `atlas-stats/stats.json` 即可 |

## 安全须知
- 密钥**只**存在于代理的服务器环境变量里，不在前端、不进 git、不进 `dist/`。
- `ALLOW_ORIGIN` 建议锁定为你的域名，防止别人盗用你的试用额度。
- 限流为「每 IP 每天 N 次」，单机内存计数；如需更强可接 Redis 或加验证码。
- 计数服务允许重复点赞（符合产品需求），如需防刷可在 Nginx 层加限速。
