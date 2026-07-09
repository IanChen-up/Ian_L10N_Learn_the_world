import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useTextSelection } from "@/hooks/useTextSelection";
import { useAIStore } from "@/stores/useAIStore";
import { useExploreStore } from "@/stores/useExploreStore";
import { getCountryByIso, localized } from "@/services/countryData";
import { useLocaleStore } from "@/stores/useLocaleStore";

export default function SelectionAsk() {
  const { t } = useTranslation();
  const { locale } = useLocaleStore();
  const { selection, clear } = useTextSelection();
  const setSelection = useAIStore((s) => s.setSelection);
  const setAiOpen = useExploreStore((s) => s.setAiOpen);
  const selectedIso = useExploreStore((s) => s.selectedIso);

  const onAsk = () => {
    if (!selection) return;
    const country = selectedIso
      ? localized(getCountryByIso(selectedIso)?.name, locale)
      : null;
    setSelection(selection.text, country);
    setAiOpen(true);
    clear();
    window.getSelection()?.removeAllRanges();
  };

  return (
    <AnimatePresence>
      {selection && (
        <motion.button
          data-no-ask
          initial={{ opacity: 0, y: 6, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.16 }}
          onMouseDown={(e) => e.preventDefault()}
          onClick={onAsk}
          style={{
            left: selection.x,
            top: selection.y - 46,
          }}
          className="fixed z-[60] flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-accent/40 bg-accent px-3 py-1.5 text-xs font-semibold text-accent-contrast shadow-lg transition hover:brightness-105"
        >
          <Sparkles size={14} />
          {t("ai.askButton")}
        </motion.button>
      )}
    </AnimatePresence>
  );
}
