/** 站点级可配置项（上线后按需修改，不含任何密钥）。
 *
 * 说明：本文件只放"公开可见"的链接与开关。任何 API 密钥都不应写在这里，
 * 也不应进入前端构建产物——试用密钥由后端代理持有（见 server/ 与部署文档）。
 *
 * 例外：天地图（Tianditu）瓦片 key 属于「浏览器端可见的地图服务 key」，
 * 与后端 AI 密钥不同——它本就要随瓦片请求发给天地图服务器，放前端是常规做法。
 * 如担心被盗用，可在天地图控制台绑定域名白名单。
 */

/** 天地图（Tianditu）中文高清底图服务 key：留空则地形图回退到 Esri（英文）。 */
export const TIANDITU_KEY = "07f11a8bd2070ff19f31c4de90209e1d";

/** 页脚"Buy Me a Coffee"打赏按钮点击后弹出套餐；此为最终跳转的收款/打赏平台链接。
 *  留空则套餐弹窗仍可展示（趣味表情反馈），但"去支持"按钮隐藏。
 *  推荐用第三方平台（如爱发电）链接，避免直接暴露个人收款码。 */
export const COFFEE_URL = "";

/** 联系方式（页脚"联系我 / 提报 Bug / 意见建议"，点击可复制）。 */
export const CONTACT_EMAIL = "ianchenxiaotong@163.com";

/** 本站 AI 能力所用模型署名（展示在创建人一栏）。 */
export const MODEL_CREDIT = "Openrouter-3o";

/**
 * 点赞 / 浏览量计数后端地址（可选）：
 * - 留空：页脚不显示点赞与浏览量（纯静态，无真实计数）。
 * - 填后端计数服务地址（如 "https://your-domain.com/api/stats"）：
 *   由 server/stats-server.mjs 提供真实、免登录、可多次点赞的计数。
 */
export const STATS_API_URL = "";

/**
 * AI 免费试用代理端点（可选）：
 * - 留空：前端不显示"免费试用"按钮，用户只能用自己的 Key。
 * - 填后端代理地址（如 "https://your-domain.com/api/trial"）：
 *   代理持有真正的密钥并做 3 次/IP 限流，浏览器永远拿不到密钥。
 */
export const TRIAL_PROXY_URL = "";

/** 每个 IP / 浏览器的试用次数（仅用于前端文案展示；真正的限流在后端）。 */
export const TRIAL_LIMIT = 3;

/**
 * 近期新闻搜索代理端点（可选）：
 * - 留空：普通模型（如 DeepSeek Chat）不会被要求编造近期新闻；只有带联网能力的模型会继续尝试。
 * - 填后端/Serverless 地址（如 Cloudflare Worker / Vercel Function）：
 *   前端请求 `${NEWS_SEARCH_PROXY_URL}?country=中国&locale=zh`，
 *   代理返回近期新闻搜索结果，再交给模型做整理。搜索 API Key 必须放在代理端，不能打包进前端。
 */
export const NEWS_SEARCH_PROXY_URL = "";
