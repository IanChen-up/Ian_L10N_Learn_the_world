import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronRight, Volume2 } from "lucide-react";
import { useLocaleStore } from "@/stores/useLocaleStore";
import { localized } from "@/services/countryData";
import { loadLanguageMeta } from "@/services/languageMeta";
import { loadLangPhrases, PHRASE_LABEL, type LangPhrasesMap } from "@/services/langPhrases";
import { speak, canSpeak } from "@/lib/tts";
import { formatPopulation } from "@/lib/format";
import type { Country, LanguageMetaMap } from "@/types/country";

/** 语言卡片：语系/文字/声调/母语人数 + 每语言常用语（哈喽/谢谢，可朗读）。 */
export default function LanguageCard({
  country,
  onBrowse,
}: {
  country: Country;
  onBrowse: (code: string) => void;
}) {
  const { t } = useTranslation();
  const { locale } = useLocaleStore();
  const [meta, setMeta] = useState<LanguageMetaMap>({});
  const [phrases, setPhrases] = useState<LangPhrasesMap>({});
  const speakable = canSpeak();

  useEffect(() => {
    let alive = true;
    Promise.all([loadLanguageMeta(), loadLangPhrases()]).then(([m, p]) => {
      if (!alive) return;
      setMeta(m);
      setPhrases(p);
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="space-y-2.5">
      {country.languages.map((l) => {
        const info = meta[l.code];
        const ph = phrases[l.code];
        return (
          <div key={l.code} className="rounded-xl border border-border bg-base/40 p-2.5">
            <button
              onClick={() => onBrowse(l.code)}
              className="group flex w-full items-center justify-between gap-2 text-start"
            >
              <span className="font-semibold text-primary transition group-hover:text-dim-language">
                {localized(l.name, locale)}
              </span>
              <ChevronRight
                size={15}
                className="rtl-flip shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-dim-language"
              />
            </button>
            {info && (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <Tag>{localized(info.family, locale)}</Tag>
                <Tag>{localized(info.script, locale)}</Tag>
                {info.tonal && <Tag accent>{t("lang.tonal")}</Tag>}
                {info.speakers != null && (
                  <Tag>
                    {t("lang.speakers")} {formatPopulation(info.speakers, locale)}
                  </Tag>
                )}
              </div>
            )}
            {/* 常用语（按语言复用，小语种也能有哈喽/谢谢） */}
            {ph && ph.items.length > 0 && (
              <div className="mt-2 space-y-1 border-t border-border/60 pt-2">
                {ph.items.slice(0, 3).map((p, i) => (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <div className="min-w-0 text-xs">
                      <span className="text-muted">
                        {localized(PHRASE_LABEL[p.key] ?? { zh: p.key, en: p.key }, locale)}
                      </span>
                      <span className="ms-1.5 font-medium text-primary">{p.text}</span>
                      {p.romanization && (
                        <span className="ms-1 text-muted">/ {p.romanization}</span>
                      )}
                    </div>
                    {speakable && (
                      <button
                        onClick={() => speak(p.text, ph.langTag)}
                        aria-label={t("profile.play")}
                        title={t("profile.play")}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border text-muted transition hover:border-dim-language hover:text-dim-language"
                      >
                        <Volume2 size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Tag({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] ${
        accent
          ? "bg-dim-language/15 text-dim-language"
          : "border border-border text-muted"
      }`}
    >
      {children}
    </span>
  );
}
