import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { Languages, Check } from "lucide-react";
import { useLocaleStore } from "@/stores/useLocaleStore";
import { SUPPORTED_LOCALES, LOCALE_META, type AppLocale } from "@/i18n";
import { cn } from "@/lib/utils";

export default function LanguageToggle() {
  const { t } = useTranslation();
  const { locale, setLocale } = useLocaleStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // 点击外部关闭
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const pick = (l: AppLocale) => {
    setLocale(l);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={t("nav.toggleLang")}
        title={t("nav.toggleLang")}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-9 items-center gap-1.5 rounded-lg border border-border px-2.5 text-secondary transition hover:border-accent hover:text-accent"
      >
        <Languages size={17} />
        <span className="hidden text-xs font-semibold sm:inline">{LOCALE_META[locale].label}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute end-0 z-50 mt-2 max-h-[70vh] w-44 overflow-y-auto rounded-xl border border-border bg-elevated p-1 shadow-lg"
          >
            {SUPPORTED_LOCALES.map((l) => {
              const active = l === locale;
              return (
                <li key={l}>
                  <button
                    role="option"
                    aria-selected={active}
                    onClick={() => pick(l)}
                    dir={LOCALE_META[l].dir}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-start text-sm transition",
                      active
                        ? "bg-accent/15 font-semibold text-primary"
                        : "text-secondary hover:bg-sunken hover:text-primary"
                    )}
                  >
                    <span className="flex flex-col leading-tight">
                      <span>{LOCALE_META[l].label}</span>
                      <span className="text-[10px] text-muted">{LOCALE_META[l].english}</span>
                    </span>
                    {active && <Check size={15} className="shrink-0 text-accent" />}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
