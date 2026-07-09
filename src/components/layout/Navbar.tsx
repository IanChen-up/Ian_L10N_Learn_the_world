import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Globe2, Sparkles, Info, BookOpen } from "lucide-react";
import SearchBox from "@/components/common/SearchBox";
import ThemeToggle from "@/components/common/ThemeToggle";
import LanguageToggle from "@/components/common/LanguageToggle";
import { useExploreStore } from "@/stores/useExploreStore";

export default function Navbar() {
  const { t } = useTranslation();
  const setSettingsOpen = useExploreStore((s) => s.setSettingsOpen);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-glass backdrop-blur-md">
      <div className="flex min-h-16 flex-wrap items-center gap-2 px-3 py-2 sm:flex-nowrap sm:gap-3 sm:px-4 sm:py-0 md:px-6">
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-accent sm:h-9 sm:w-9">
            <Globe2 size={19} />
          </span>
          <span className="hidden sm:flex flex-col leading-none">
            <span className="font-display text-lg font-semibold text-primary">
              {t("app.name")}
            </span>
            <span className="text-[11px] text-muted">{t("app.tagline")}</span>
          </span>
        </Link>

        <div className="order-2 flex w-full flex-1 justify-center sm:order-none sm:w-auto sm:px-2">
          <SearchBox />
        </div>

        <nav className="ms-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setSettingsOpen(true)}
            className="hidden items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-secondary transition hover:border-accent hover:text-accent sm:flex"
          >
            <Sparkles size={15} />
            {t("nav.aiSettings")}
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            aria-label={t("nav.aiSettings")}
            title={t("nav.aiSettings")}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-secondary transition hover:border-accent hover:text-accent sm:hidden"
          >
            <Sparkles size={17} />
          </button>
          <Link
            to="/resources"
            aria-label={t("nav.resources")}
            title={t("nav.resources")}
            className="hidden h-9 w-9 items-center justify-center rounded-lg border border-border text-secondary transition hover:border-accent hover:text-accent sm:flex"
          >
            <BookOpen size={18} />
          </Link>
          <Link
            to="/about"
            aria-label={t("nav.about")}
            title={t("nav.about")}
            className="hidden h-9 w-9 items-center justify-center rounded-lg border border-border text-secondary transition hover:border-accent hover:text-accent sm:flex"
          >
            <Info size={18} />
          </Link>
          <LanguageToggle />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
