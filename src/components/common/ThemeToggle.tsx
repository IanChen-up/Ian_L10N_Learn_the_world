import { useTranslation } from "react-i18next";
import { Sun, Moon } from "lucide-react";
import { useThemeStore } from "@/stores/useThemeStore";
import { AnimatePresence, motion } from "framer-motion";

export default function ThemeToggle() {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label={t("nav.toggleTheme")}
      title={t("nav.toggleTheme")}
      className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border text-secondary transition hover:border-accent hover:text-accent"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ rotate: -30, opacity: 0, scale: 0.6 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 30, opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.2 }}
          className="absolute"
        >
          {isDark ? <Moon size={18} /> : <Sun size={18} />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
