import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Coffee, Heart, Eye, Mail, Check } from "lucide-react";
import { CONTACT_EMAIL, MODEL_CREDIT } from "@/config/site";
import { recordView, addLike, statsEnabled, type SiteStats } from "@/services/stats";
import CoffeeModal from "./CoffeeModal";

/** 页脚署名 + 打赏 + 点赞/浏览量 + 联系方式复制 + 模型署名。 */
export default function CreatorCredit() {
  const { t } = useTranslation();
  const [coffeeOpen, setCoffeeOpen] = useState(false);
  const [stats, setStats] = useState<SiteStats | null>(null);
  const [liking, setLiking] = useState(false);
  const [copied, setCopied] = useState(false);

  // 进入页面记录一次真实访问
  useEffect(() => {
    if (!statsEnabled) return;
    recordView().then((s) => s && setStats(s));
  }, []);

  const like = async () => {
    if (liking) return;
    setLiking(true);
    const s = await addLike();
    if (s) setStats(s);
    setTimeout(() => setLiking(false), 240);
  };

  const copyContact = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
    } catch {
      // 忽略：部分浏览器需 HTTPS/用户手势
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const fmt = (n: number) => (n >= 10000 ? `${(n / 10000).toFixed(1)}w` : n.toLocaleString());

  return (
    <>
      <div className="pointer-events-none absolute bottom-2 start-3 z-10 flex flex-wrap items-center gap-x-2.5 gap-y-1 pe-3">
        <span className="text-[11px] text-muted/70">
          {t("common.createdBy")} · {t("common.creator")}
        </span>
        <span className="text-[11px] text-muted/50" title={t("common.poweredByTip")}>
          · {t("common.poweredBy")} {MODEL_CREDIT}
        </span>

        {/* 浏览量 + 点赞（仅在配置后端计数时显示真实数据） */}
        {statsEnabled && (
          <span className="pointer-events-auto flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1 text-[11px] text-muted" title={t("stats.views")}>
              <Eye size={12} />
              {stats ? fmt(stats.views) : "…"}
            </span>
            <button
              onClick={like}
              title={t("stats.likeTip")}
              className={`inline-flex items-center gap-1 rounded-full border border-border bg-glass px-2 py-0.5 text-[11px] font-medium text-secondary shadow-sm backdrop-blur transition hover:border-dim-religion hover:text-dim-religion ${
                liking ? "scale-110" : ""
              }`}
            >
              <Heart size={12} className={liking ? "fill-dim-religion text-dim-religion" : ""} />
              {stats ? fmt(stats.likes) : t("stats.like")}
            </button>
          </span>
        )}

        {/* 联系方式复制：联系我 / 提报 Bug / 意见建议 */}
        <button
          onClick={copyContact}
          title={t("contact.tip")}
          className="pointer-events-auto inline-flex items-center gap-1 rounded-full border border-border bg-glass px-2 py-0.5 text-[11px] font-medium text-secondary shadow-sm backdrop-blur transition hover:border-accent hover:text-accent"
        >
          {copied ? <Check size={12} /> : <Mail size={12} />}
          {copied ? t("contact.copied") : t("contact.label")}
        </button>

        {/* Buy Me a Coffee：点击弹出套餐 */}
        <button
          onClick={() => setCoffeeOpen(true)}
          title={t("common.buyCoffee")}
          className="pointer-events-auto inline-flex items-center gap-1 rounded-full border border-border bg-glass px-2 py-0.5 text-[11px] font-medium text-secondary shadow-sm backdrop-blur transition hover:border-accent hover:text-accent"
        >
          <Coffee size={12} />
          {t("common.buyCoffee")}
        </button>
      </div>

      {coffeeOpen && <CoffeeModal onClose={() => setCoffeeOpen(false)} />}
    </>
  );
}
