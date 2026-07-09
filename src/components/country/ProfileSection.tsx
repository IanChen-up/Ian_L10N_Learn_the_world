import { useTranslation } from "react-i18next";
import { Volume2, ExternalLink, Trophy, Languages, Landmark, Sparkles } from "lucide-react";
import { useLocaleStore } from "@/stores/useLocaleStore";
import { localized } from "@/services/countryData";
import { PHRASE_LABEL } from "@/services/langPhrases";
import { speak, canSpeak } from "@/lib/tts";
import type { LocalizedText } from "@/types/country";
import type { CountryProfile, SourceRef } from "@/types/profile";

const t9 = (
  zh: string,
  en: string,
  ja: string,
  ko: string,
  ar: string,
  fr: string,
  ru: string,
  es: string,
  zhHant = zh,
): LocalizedText => ({ zh, "zh-Hant": zhHant, en, ja, ko, ar, fr, ru, es });

const SYMBOL_LABEL: Record<string, LocalizedText> = {
  flower: t9("国花", "National flower", "国花", "국화", "الزهرة الوطنية", "Fleur nationale", "Национальный цветок", "Flor nacional", "國花"),
  bird: t9("国鸟", "National bird", "国鳥", "국조", "الطائر الوطني", "Oiseau national", "Национальная птица", "Ave nacional", "國鳥"),
  animal: t9("国兽", "National animal", "国獣", "국수", "الحيوان الوطني", "Animal national", "Национальное животное", "Animal nacional", "國獸"),
  tree: t9("国树", "National tree", "国樹", "국목", "الشجرة الوطنية", "Arbre national", "Национальное дерево", "Árbol nacional", "國樹"),
  sport: t9("国球 / 国技", "National sport", "国技 / 国民的スポーツ", "국기 / 국민 스포츠", "الرياضة الوطنية", "Sport national", "Национальный вид спорта", "Deporte nacional", "國球 / 國技"),
};

function SourceLink({ source }: { source?: SourceRef }) {
  const { t } = useTranslation();
  const { locale } = useLocaleStore();
  if (!source) return null;
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-[11px] text-muted transition hover:text-accent"
    >
      <ExternalLink size={11} />
      {t("common.dataSource")}: {localized(source.label, locale)}
      {source.year ? ` (${source.year})` : ""}
    </a>
  );
}

function Card({
  icon,
  cssVar,
  title,
  children,
}: {
  icon: React.ReactNode;
  cssVar: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-2xl border border-border bg-elevated/60 p-4"
      style={{ borderInlineStartColor: `hsl(var(${cssVar}))`, borderInlineStartWidth: 3 }}
    >
      <div className="mb-2.5 flex items-center gap-2">
        <span style={{ color: `hsl(var(${cssVar}))` }}>{icon}</span>
        <h3
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: `hsl(var(${cssVar}))` }}
        >
          {title}
        </h3>
      </div>
      <div className="text-sm text-primary">{children}</div>
    </section>
  );
}

export default function ProfileSection({ profile }: { profile: CountryProfile }) {
  const { t } = useTranslation();
  const { locale } = useLocaleStore();
  const speakable = canSpeak();

  return (
    <div className="space-y-3">
      {/* 概述 */}
      {profile.overview && (
        <Card icon={<Sparkles size={15} />} cssVar="--dim-capital" title={t("profile.overview")}>
          <p className="leading-relaxed text-secondary">{localized(profile.overview, locale)}</p>
          <SourceLink source={profile.sources?.overview} />
        </Card>
      )}

      {/* 首都历史 + 气候 + 经纬度 */}
      {(profile.capitalHistory || profile.climate) && (
        <Card icon={<Landmark size={15} />} cssVar="--dim-capital" title={t("profile.geoCulture")}>
          {profile.capitalHistory && (
            <div className="mb-2">
              <span className="text-xs font-semibold text-muted">{t("profile.capitalHistory")}</span>
              <p className="mt-0.5 leading-relaxed text-secondary">
                {localized(profile.capitalHistory, locale)}
              </p>
            </div>
          )}
          {profile.climate && (
            <div>
              <span className="text-xs font-semibold text-muted">{t("profile.climate")}</span>
              <p className="mt-0.5 leading-relaxed text-secondary">
                {localized(profile.climate, locale)}
              </p>
            </div>
          )}
        </Card>
      )}

      {/* 常用语（TTS） */}
      {profile.phrases && profile.phrases.length > 0 && (
        <Card icon={<Languages size={15} />} cssVar="--dim-language" title={t("profile.phrases")}>
          <div className="space-y-1.5">
            {profile.phrases.map((p, i) => {
              const label = PHRASE_LABEL[p.key] ? localized(PHRASE_LABEL[p.key], locale) : p.key;
              return (
                <div key={i} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-xs text-muted">{label}</span>
                    <div className="truncate font-medium">
                      {p.text}
                      {p.romanization && (
                        <span className="ms-1.5 text-xs text-muted">/ {p.romanization}</span>
                      )}
                    </div>
                  </div>
                  {speakable && (
                    <button
                      onClick={() => speak(p.text, p.langTag)}
                      aria-label={t("profile.play")}
                      title={t("profile.play")}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted transition hover:border-dim-language hover:text-dim-language"
                    >
                      <Volume2 size={15} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* 趣味 & 指标：国歌/象征/字母数/QS/遗产 */}
      {(profile.anthem ||
        profile.symbols?.length ||
        profile.alphabetCount != null ||
        profile.qsTop100 != null ||
        profile.unescoSites != null) && (
        <Card icon={<Sparkles size={15} />} cssVar="--dim-holiday" title={t("profile.funMetrics")}>
          <div className="space-y-2">
            {profile.anthem && (
              <Row label={t("profile.anthem")} value={localized(profile.anthem.name, locale)} />
            )}
            {profile.symbols?.map((s, i) => (
              <Row
                key={i}
                label={SYMBOL_LABEL[s.key] ? localized(SYMBOL_LABEL[s.key], locale) : s.key}
                value={localized(s.name, locale)}
              />
            ))}
            {profile.alphabetCount != null && (
              <Row label={t("profile.alphabet")} value={`${profile.alphabetCount}`} />
            )}
            {profile.qsTop100 != null && (
              <Row label={t("profile.qsTop100")} value={`${profile.qsTop100}`} />
            )}
            {profile.unescoSites != null && (
              <Row label={t("profile.unesco")} value={`${profile.unescoSites}`} />
            )}
          </div>
          <SourceLink source={profile.sources?.metrics} />
        </Card>
      )}

      {/* 足球 / 世界杯 */}
      {profile.football && (
        <Card icon={<Trophy size={15} />} cssVar="--dim-government" title={t("profile.football")}>
          <div className="space-y-2">
            {profile.football.fifaRank != null && (
              <Row label={t("profile.fifaRank")} value={`#${profile.football.fifaRank}`} />
            )}
            {profile.football.worldCupTitles != null && (
              <Row
                label={t("profile.worldCupTitles")}
                value={`${profile.football.worldCupTitles} ${t("profile.times")}`}
              />
            )}
            {profile.football.note && (
              <p className="text-xs leading-relaxed text-secondary">
                {localized(profile.football.note, locale)}
              </p>
            )}
          </div>
          <SourceLink source={profile.sources?.football} />
        </Card>
      )}

      {/* 本地化注意事项 */}
      {profile.localization && (
        <Card icon={<Languages size={15} />} cssVar="--dim-religion" title={t("profile.localization")}>
          <div className="space-y-2">
            <Row
              label={t("profile.direction")}
              value={profile.localization.direction === "rtl" ? t("profile.rtl") : t("profile.ltr")}
            />
            {profile.localization.grammaticalGender != null && (
              <Row
                label={t("profile.gender")}
                value={profile.localization.grammaticalGender ? t("panel.yes") : t("profile.no")}
              />
            )}
            {profile.localization.colorNotes?.length ? (
              <NoteList title={t("profile.colorNotes")} items={profile.localization.colorNotes.map((x) => localized(x, locale))} />
            ) : null}
            {profile.localization.culturalTaboos?.length ? (
              <NoteList title={t("profile.taboos")} items={profile.localization.culturalTaboos.map((x) => localized(x, locale))} />
            ) : null}
            {profile.localization.formatting?.length ? (
              <NoteList title={t("profile.formatting")} items={profile.localization.formatting.map((x) => localized(x, locale))} />
            ) : null}
          </div>
        </Card>
      )}

      {/* 冷知识 */}
      {profile.funFacts && profile.funFacts.length > 0 && (
        <Card icon={<Sparkles size={15} />} cssVar="--dim-currency" title={t("profile.funFacts")}>
          <ul className="list-disc space-y-1.5 ps-4 text-secondary">
            {profile.funFacts.map((f, i) => (
              <li key={i} className="leading-relaxed">
                {localized(f, locale)}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="shrink-0 text-xs text-muted">{label}</span>
      <span className="text-end text-sm font-medium">{value}</span>
    </div>
  );
}

function NoteList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <span className="text-xs font-semibold text-muted">{title}</span>
      <ul className="mt-1 list-disc space-y-1 ps-4 text-xs leading-relaxed text-secondary">
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </div>
  );
}
