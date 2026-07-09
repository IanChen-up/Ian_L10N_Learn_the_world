import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, ExternalLink } from "lucide-react";
import { useLocaleStore } from "@/stores/useLocaleStore";
import { localized } from "@/services/countryData";
import { COFFEE_TIERS, type CoffeeTier } from "@/data/coffeeTiers";
import { COFFEE_URL } from "@/config/site";

/** "Buy Me a Coffee" 套餐弹窗：点击套餐先弹出搞笑表情反馈，再引导去支持平台。 */
export default function CoffeeModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const { locale } = useLocaleStore();
  const [picked, setPicked] = useState<CoffeeTier | null>(null);

  const amountLabel = (tier: CoffeeTier) =>
    tier.amount == null ? t("coffee.moreTier") : `¥${tier.amount}`;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 14 }}
        transition={{ type: "spring", damping: 26, stiffness: 320 }}
        className="relative z-10 flex max-h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-border bg-base shadow-lg"
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-primary">
            ☕ {t("common.buyCoffee")}
          </h2>
          <button
            onClick={onClose}
            aria-label={t("panel.close")}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-sunken hover:text-primary"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto p-6">
          <p className="text-sm leading-relaxed text-secondary">{t("coffee.intro")}</p>

          {/* 选中套餐后的搞笑表情反馈 */}
          <AnimatePresence>
            {picked && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", damping: 18, stiffness: 300 }}
                className="rounded-2xl border border-accent/30 bg-accent/8 p-4 text-center"
              >
                <motion.div
                  key={picked.emoji}
                  initial={{ scale: 0.4, rotate: -12 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", damping: 10, stiffness: 260 }}
                  className="text-6xl leading-none"
                >
                  {picked.emoji}
                </motion.div>
                <p className="mt-3 text-sm font-medium leading-relaxed text-primary">
                  {localized(picked.reaction, locale)}
                </p>
                {COFFEE_URL ? (
                  <a
                    href={COFFEE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-contrast transition hover:brightness-105"
                  >
                    <Heart size={15} />
                    {t("coffee.goSupport", { amount: amountLabel(picked) })}
                    <ExternalLink size={13} />
                  </a>
                ) : (
                  <p className="mt-3 text-xs text-muted">{t("coffee.noPlatform")}</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* 套餐列表 */}
          <div className="grid grid-cols-2 gap-2.5">
            {COFFEE_TIERS.map((tier, i) => {
              const active = picked === tier;
              return (
                <button
                  key={i}
                  onClick={() => setPicked(tier)}
                  className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-start transition ${
                    active
                      ? "border-accent bg-accent/10 shadow-sm"
                      : "border-border bg-elevated/50 hover:border-accent/60 hover:bg-sunken"
                  }`}
                >
                  <span className="text-2xl leading-none">{tier.emoji}</span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-primary">
                      {amountLabel(tier)}
                    </span>
                    <span className="block truncate text-[11px] text-muted">
                      {tier.amount == null ? t("coffee.moreHint") : t("coffee.tapHint")}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <p className="text-center text-[11px] leading-relaxed text-muted">
            {t("coffee.disclaimer")}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
