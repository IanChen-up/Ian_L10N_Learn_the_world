import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldCheck, Check, ExternalLink, Sparkles } from "lucide-react";
import { useExploreStore } from "@/stores/useExploreStore";
import { useAIStore } from "@/stores/useAIStore";
import { useLocaleStore } from "@/stores/useLocaleStore";
import { MODEL_PRESETS } from "@/data/modelPresets";
import { TRIAL_PROXY_URL, TRIAL_LIMIT } from "@/config/site";

export default function AISettingsModal() {
  const { t } = useTranslation();
  const { locale } = useLocaleStore();
  const open = useExploreStore((s) => s.settingsOpen);
  const setOpen = useExploreStore((s) => s.setSettingsOpen);
  const config = useAIStore((s) => s.config);
  const setConfig = useAIStore((s) => s.setConfig);
  const clearKey = useAIStore((s) => s.clearKey);
  const trialRemaining = useAIStore((s) => s.trialRemaining);

  const [baseURL, setBaseURL] = useState(config.baseURL);
  const [apiKey, setApiKey] = useState(config.apiKey);
  const [model, setModel] = useState(config.model);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (open) {
      setBaseURL(config.baseURL);
      setApiKey(config.apiKey);
      setModel(config.model);
      setSaved(false);
    }
  }, [open, config]);

  const save = () => {
    setConfig({ baseURL: baseURL.trim(), apiKey: apiKey.trim(), model: model.trim() });
    setSaved(true);
    setTimeout(() => setOpen(false), 600);
  };

  const applyPreset = (baseURL: string, model: string) => {
    setBaseURL(baseURL);
    setModel(model);
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="relative z-10 flex max-h-[94dvh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-base shadow-lg sm:max-h-[88vh]"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6 sm:py-4">
              <h2 className="font-display text-lg font-semibold text-primary">
                ✨ {t("ai.settings.title")}
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-sunken hover:text-primary"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto overscroll-contain p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6">
              <p className="text-sm leading-relaxed text-secondary">
                {t("ai.settings.desc")}
              </p>

              {/* 教程 */}
              <div className="rounded-xl border border-border bg-elevated/50 p-3.5">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  {t("ai.settings.tutorialTitle")}
                </h3>
                <ol className="list-decimal space-y-1 ps-4 text-xs leading-relaxed text-secondary">
                  <li>{t("ai.settings.step1")}</li>
                  <li>{t("ai.settings.step2")}</li>
                  <li>{t("ai.settings.step3")}</li>
                </ol>
              </div>

              {/* 模型预设 */}
              <div>
                <span className="mb-1.5 block text-xs font-medium text-muted">
                  {t("ai.settings.presets")}
                </span>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {MODEL_PRESETS.map((p) => (
                    <div
                      key={p.id}
                      className="rounded-xl border border-border bg-elevated/40 p-2.5"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <button
                          onClick={() => applyPreset(p.baseURL, p.model)}
                          className="truncate text-start text-sm font-semibold text-primary transition hover:text-accent"
                          title={t("ai.settings.usePreset")}
                        >
                          {p.label}
                          {p.recommended && (
                            <span className="ms-1 rounded-full bg-accent/15 px-1.5 py-0.5 text-[10px] font-medium text-accent">
                              {t("ai.settings.recommended")}
                            </span>
                          )}
                        </button>
                        <a
                          href={p.site}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={t("ai.settings.getKey")}
                          className="shrink-0 text-muted transition hover:text-accent"
                        >
                          <ExternalLink size={13} />
                        </a>
                      </div>
                      <p className="mt-1 text-[11px] leading-snug text-muted">
                        {locale === "zh" ? p.note.zh : p.note.en}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] text-muted">{t("ai.settings.rechargeNote")}</p>
              </div>

              <Field label={t("ai.settings.baseURL")}>
                <input
                  value={baseURL}
                  onChange={(e) => setBaseURL(e.target.value)}
                  placeholder="https://dashscope.aliyuncs.com/compatible-mode/v1"
                  className="input"
                />
              </Field>

              <Field label={t("ai.settings.apiKey")}>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="input"
                />
              </Field>

              <Field label={t("ai.settings.model")}>
                <input
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="qwen3.7-plus"
                  className="input"
                />
              </Field>

              {/* 免费试用（仅在配置了后端代理时显示） */}
              {TRIAL_PROXY_URL && (
                <div className="flex items-start gap-2 rounded-xl border border-accent/30 bg-accent/8 px-3 py-2.5 text-xs leading-relaxed text-secondary">
                  <Sparkles size={16} className="mt-0.5 shrink-0 text-accent" />
                  <span>
                    {t("ai.settings.trialNote", { limit: TRIAL_LIMIT })}
                    {trialRemaining != null && (
                      <b className="ms-1 text-accent">
                        {t("ai.settings.trialRemaining", { n: trialRemaining })}
                      </b>
                    )}
                  </span>
                </div>
              )}

              <div className="flex items-start gap-2 rounded-xl border border-dim-capital/30 bg-dim-capital/8 px-3 py-2.5 text-xs leading-relaxed text-secondary">
                <ShieldCheck size={16} className="mt-0.5 shrink-0 text-dim-capital" />
                <span>{t("ai.settings.securityNote")}</span>
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  onClick={clearKey}
                  className="text-xs text-muted transition hover:text-dim-government"
                >
                  {t("ai.settings.clearKey")}
                </button>
                <button
                  onClick={save}
                  className="flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-accent-contrast transition hover:brightness-105"
                >
                  {saved ? <Check size={16} /> : null}
                  {saved ? t("ai.settings.saved") : t("ai.settings.save")}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}
