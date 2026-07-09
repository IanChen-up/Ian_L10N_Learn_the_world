import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Newspaper, Loader2, RefreshCw, Settings } from "lucide-react";
import { useCountryNews } from "@/hooks/useCountryNews";
import { useLocaleStore } from "@/stores/useLocaleStore";
import { useExploreStore } from "@/stores/useExploreStore";

/** 把 AI 返回的 markdown 无序列表拆成条目 */
function parseBullets(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .map((l) => l.replace(/^[-*•]\s*/, "").replace(/^\d+[.)]\s*/, ""))
    .filter((l) => l.length > 1);
}

export default function RecentNews({ countryName }: { countryName: string }) {
  const { t } = useTranslation();
  const { locale } = useLocaleStore();
  const setSettingsOpen = useExploreStore((s) => s.setSettingsOpen);
  const { loading, text, error, done, fetchNews, configured } = useCountryNews();
  const [started, setStarted] = useState(false);

  const run = () => {
    setStarted(true);
    fetchNews(countryName, locale);
  };

  const bullets = parseBullets(text);

  return (
    <section
      className="rounded-2xl border border-border bg-elevated/60 p-4"
      style={{ borderInlineStartColor: "hsl(var(--dim-holiday))", borderInlineStartWidth: 3 }}
    >
      <div className="mb-2.5 flex items-center gap-2">
        <span style={{ color: "hsl(var(--dim-holiday))" }}>
          <Newspaper size={15} />
        </span>
        <h3
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: "hsl(var(--dim-holiday))" }}
        >
          {t("news.title")}
        </h3>
      </div>

      {!configured ? (
        <div className="space-y-2">
          <p className="text-xs leading-relaxed text-muted">{t("news.needConfig")}</p>
          <button
            onClick={() => setSettingsOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-secondary transition hover:border-accent hover:text-accent"
          >
            <Settings size={13} />
            {t("ai.openSettings")}
          </button>
        </div>
      ) : !started ? (
        <button
          onClick={run}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent/12 px-3 py-2 text-xs font-medium text-accent transition hover:bg-accent/20"
        >
          <Newspaper size={14} />
          {t("news.fetch")}
        </button>
      ) : (
        <div className="space-y-2">
          {bullets.length > 0 && (
            <ul className="list-disc space-y-1.5 ps-4 text-sm leading-relaxed text-secondary">
              {bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          )}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-muted">
              <Loader2 size={13} className="animate-spin" />
              {t("news.loading")}
            </div>
          )}
          {error && <p className="text-xs text-muted">⚠️ {error}</p>}
          {done && (
            <div className="flex items-center justify-between gap-2 pt-1">
              <p className="text-[11px] leading-snug text-muted">{t("news.disclaimer")}</p>
              <button
                onClick={run}
                aria-label={t("news.refresh")}
                title={t("news.refresh")}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border text-muted transition hover:border-accent hover:text-accent"
              >
                <RefreshCw size={13} />
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
