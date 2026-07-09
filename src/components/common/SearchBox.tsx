import { useState, useMemo, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Search, X, Sparkles, Loader2 } from "lucide-react";
import { useExploreStore } from "@/stores/useExploreStore";
import { useLocaleStore } from "@/stores/useLocaleStore";
import { useAIStore } from "@/stores/useAIStore";
import { useDimensionIndexes } from "@/hooks/useDimensionIndexes";
import { searchAll, type SearchResult } from "@/services/search";
import { aiResolveCountry, matchByName } from "@/services/aiSearch";
import { getCountryByIso, localized } from "@/services/countryData";
import FlagIcon from "@/components/common/FlagIcon";

export default function SearchBox() {
  const { t } = useTranslation();
  const { locale } = useLocaleStore();
  const navigate = useNavigate();
  const selectCountry = useExploreStore((s) => s.selectCountry);
  const setSettingsOpen = useExploreStore((s) => s.setSettingsOpen);
  const canUseAI = useAIStore((s) => s.canUseAI);
  const resolveProvider = useAIStore((s) => s.resolveProvider);
  const indexes = useDimensionIndexes();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnswer, setAiAnswer] = useState<{ text: string; iso: string | null } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const results = useMemo<SearchResult[]>(
    () => searchAll(query, indexes, locale, t),
    [query, indexes, locale, t]
  );

  useEffect(() => {
    setActiveIdx(0);
    setAiAnswer(null);
    setAiError(null);
  }, [query]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const choose = (r: SearchResult) => {
    if (r.kind === "country") {
      selectCountry(r.iso);
    } else {
      navigate(`/browse/${r.dimension}/${encodeURIComponent(r.value)}`);
    }
    setQuery("");
    setOpen(false);
  };

  /** AI 智能搜索：把问题交给 AI 解析出目标国家并联动地图 */
  const runAISearch = async () => {
    const q = query.trim();
    if (!q || aiLoading) return;
    setAiError(null);
    setAiAnswer(null);

    const resolved = resolveProvider();
    if (!resolved) {
      // 无 AI：退化为按国名兜底匹配
      const iso = matchByName(q, locale);
      if (iso) {
        selectCountry(iso);
        setQuery("");
        setOpen(false);
      } else {
        setAiError(t("aiSearch.needConfig"));
      }
      return;
    }

    setAiLoading(true);
    try {
      const res = await aiResolveCountry(q, resolved.provider, locale);
      resolved.onSuccess();
      if (res.iso) {
        setAiAnswer({ text: res.answer, iso: res.iso });
      } else {
        setAiAnswer({ text: res.answer || t("aiSearch.noCountry"), iso: null });
      }
    } catch (e) {
      const msg = (e as Error).message;
      setAiError(msg === "TRIAL_EXCEEDED" ? t("aiSearch.trialExceeded") : t("aiSearch.error"));
    } finally {
      setAiLoading(false);
    }
  };

  const gotoAICountry = () => {
    if (aiAnswer?.iso) {
      selectCountry(aiAnswer.iso);
      setQuery("");
      setOpen(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      // 有文本搜索结果时优先选中；否则触发 AI 搜索
      if (results.length) {
        e.preventDefault();
        choose(results[activeIdx]);
      } else if (query.trim()) {
        e.preventDefault();
        runAISearch();
      }
      return;
    }
    if (!results.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const showDropdown = open && (results.length > 0 || query.trim().length > 0);

  return (
    <div ref={boxRef} className="relative w-full max-w-sm">
      <div className="flex items-center gap-2 rounded-xl border border-border bg-elevated/60 px-3 py-2 transition focus-within:border-accent">
        <Search size={16} className="shrink-0 text-muted" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={t("nav.searchPlaceholder")}
          className="w-full bg-transparent text-sm text-primary outline-none placeholder:text-muted"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="text-muted transition hover:text-primary"
            aria-label="clear"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute z-50 mt-2 max-h-[70vh] w-full overflow-y-auto rounded-xl border border-border bg-elevated shadow-lg">
          {/* AI 智能搜索入口：始终置顶，可对整句提问 */}
          <button
            onClick={runAISearch}
            disabled={aiLoading}
            className="flex w-full items-center gap-2.5 border-b border-border px-3 py-2.5 text-start text-sm transition hover:bg-accent/8 disabled:opacity-60"
          >
            {aiLoading ? (
              <Loader2 size={16} className="shrink-0 animate-spin text-accent" />
            ) : (
              <Sparkles size={16} className="shrink-0 text-accent" />
            )}
            <span className="flex-1 truncate">
              <span className="font-medium text-primary">{t("aiSearch.ask")}</span>
              {query.trim() && (
                <span className="ms-1 text-muted">「{query.trim()}」</span>
              )}
            </span>
            {!canUseAI() && (
              <span className="shrink-0 text-[11px] text-muted">{t("aiSearch.byok")}</span>
            )}
          </button>

          {/* AI 回答 */}
          {aiAnswer && (
            <div className="border-b border-border bg-accent/5 px-3 py-2.5">
              <p className="text-xs leading-relaxed text-secondary">{aiAnswer.text}</p>
              {aiAnswer.iso && (
                <button
                  onClick={gotoAICountry}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-contrast transition hover:brightness-105"
                >
                  {getCountryByIso(aiAnswer.iso) && (
                    <FlagIcon
                      iso={aiAnswer.iso}
                      emoji={getCountryByIso(aiAnswer.iso)!.flag}
                      name={localized(getCountryByIso(aiAnswer.iso)?.name, locale)}
                      className="h-4 w-6"
                    />
                  )}
                  {t("aiSearch.openCountry", {
                    name: localized(getCountryByIso(aiAnswer.iso)?.name, locale),
                  })}
                </button>
              )}
            </div>
          )}
          {aiError && (
            <div className="border-b border-border px-3 py-2.5 text-xs text-dim-government">
              {aiError}{" "}
              <button onClick={() => setSettingsOpen(true)} className="underline hover:text-accent">
                {t("ai.openSettings")}
              </button>
            </div>
          )}

          {/* 文本搜索结果 */}
          {results.length > 0 && (
            <ul>
              {results.map((r, i) => {
                const key = r.kind === "country" ? `c-${r.iso}` : `d-${r.dimension}-${r.value}`;
                return (
                  <li key={key}>
                    <button
                      onMouseEnter={() => setActiveIdx(i)}
                      onClick={() => choose(r)}
                      className={`flex w-full items-center gap-3 px-3 py-2 text-start text-sm transition ${
                        i === activeIdx ? "bg-accent/12 text-primary" : "text-secondary"
                      }`}
                    >
                      {r.kind === "country" ? (
                        <FlagIcon iso={r.iso} emoji={r.flag} name={r.label} className="h-5 w-7" />
                      ) : (
                        <span className="text-lg leading-none">{r.emoji}</span>
                      )}
                      <span className="flex-1 truncate font-medium">{r.label}</span>
                      <span className="shrink-0 text-xs text-muted">
                        {r.kind === "country" ? r.sub : `${r.sub} · ${r.count}`}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
