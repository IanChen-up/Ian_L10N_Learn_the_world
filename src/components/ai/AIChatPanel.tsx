import { useRef, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Square, Trash2, Settings2, Sparkles } from "lucide-react";
import { useExploreStore } from "@/stores/useExploreStore";
import { useAIStore } from "@/stores/useAIStore";
import { useLocaleStore } from "@/stores/useLocaleStore";
import { localeDir } from "@/i18n";
import ChatMessageBubble from "./ChatMessageBubble";

export default function AIChatPanel() {
  const { t } = useTranslation();
  const { locale } = useLocaleStore();
  const open = useExploreStore((s) => s.aiOpen);
  const setOpen = useExploreStore((s) => s.setAiOpen);
  const setSettingsOpen = useExploreStore((s) => s.setSettingsOpen);

  const messages = useAIStore((s) => s.messages);
  const streaming = useAIStore((s) => s.streaming);
  const configured = useAIStore((s) => s.configured);
  const trialRemaining = useAIStore((s) => s.trialRemaining);
  const selection = useAIStore((s) => s.selection);
  const ask = useAIStore((s) => s.ask);
  const stop = useAIStore((s) => s.stop);
  const clearChat = useAIStore((s) => s.clearChat);

  // 可用条件：已配置自己的 Key，或启用了后端试用且仍有剩余次数
  const canUse = configured || (trialRemaining != null && trialRemaining > 0);
  const enterX = localeDir(locale) === "rtl" ? "-100%" : "100%";

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = () => {
    const text = input.trim();
    if (!text || streaming || !canUse) return;
    ask(text, locale);
    setInput("");
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[55] bg-black/20 md:hidden"
          />
          <motion.aside
            data-no-ask
            initial={{ x: enterX }}
            animate={{ x: 0 }}
            exit={{ x: enterX }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed end-0 top-0 z-[56] flex h-[100dvh] w-full max-w-md flex-col border-s border-border bg-base shadow-lg"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5 sm:py-4">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-primary">
                <Sparkles size={18} className="text-accent" />
                {t("ai.panelTitle")}
              </h2>
              <div className="flex items-center gap-1">
                <IconBtn label={t("ai.settings.title")} onClick={() => setSettingsOpen(true)}>
                  <Settings2 size={17} />
                </IconBtn>
                <IconBtn label={t("ai.clear")} onClick={clearChat}>
                  <Trash2 size={17} />
                </IconBtn>
                <IconBtn label={t("panel.close")} onClick={() => setOpen(false)}>
                  <X size={18} />
                </IconBtn>
              </div>
            </div>

            {/* Selection context */}
            {selection && (
              <div className="border-b border-border bg-accent/8 px-5 py-2.5">
                <span className="text-[11px] font-medium uppercase tracking-wide text-muted">
                  {t("ai.contextLabel")}
                </span>
                <p className="mt-0.5 line-clamp-2 text-sm italic text-secondary">
                  “{selection}”
                </p>
              </div>
            )}

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto overscroll-contain p-4 sm:p-5">
              {!canUse ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                  <p className="text-sm text-muted">{t("ai.needConfig")}</p>
                  <button
                    onClick={() => setSettingsOpen(true)}
                    className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-contrast transition hover:brightness-105"
                  >
                    {t("ai.openSettings")}
                  </button>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <p className="max-w-xs text-center text-sm leading-relaxed text-muted">
                    {t("ai.emptyHint")}
                  </p>
                </div>
              ) : (
                messages.map((m) => <ChatMessageBubble key={m.id} item={m} />)
              )}
            </div>

            {/* Input */}
            <div className="border-t border-border p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4">
              <div className="flex items-end gap-2 rounded-xl border border-border bg-elevated p-2 focus-within:border-accent">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  rows={1}
                  disabled={!canUse}
                  placeholder={t("ai.inputPlaceholder")}
                  className="max-h-32 flex-1 resize-none bg-transparent px-2 py-1 text-sm text-primary outline-none placeholder:text-muted disabled:opacity-50"
                />
                {streaming ? (
                  <button
                    onClick={stop}
                    aria-label={t("ai.stop")}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-dim-government text-white transition hover:brightness-105"
                  >
                    <Square size={15} />
                  </button>
                ) : (
                  <button
                    onClick={send}
                    disabled={!input.trim() || !canUse}
                    aria-label={t("ai.send")}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-contrast transition hover:brightness-105 disabled:opacity-40"
                  >
                    <Send size={15} />
                  </button>
                )}
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function IconBtn({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-sunken hover:text-primary"
    >
      {children}
    </button>
  );
}
