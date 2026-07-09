import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ArrowLeft, BookOpen, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { useLocaleStore } from "@/stores/useLocaleStore";
import { localized } from "@/services/countryData";
import { RESOURCE_CATEGORIES } from "@/data/resources";

export default function Resources() {
  const { t } = useTranslation();
  const { locale } = useLocaleStore();

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link
          to="/"
          className="mb-10 inline-flex items-center gap-2 text-sm text-muted transition hover:text-accent"
        >
          <ArrowLeft size={16} />
          {t("about.backHome")}
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 text-accent">
            <BookOpen size={28} />
          </span>
          <h1 className="mt-6 font-display text-4xl font-bold text-primary">
            {t("resources.title")}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-secondary">
            {t("resources.intro")}
          </p>
        </motion.div>

        <div className="mt-12 space-y-10">
          {RESOURCE_CATEGORIES.map((cat, ci) => (
            <motion.section
              key={cat.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 * ci }}
            >
              <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-primary">
                <span className="text-lg leading-none">{cat.emoji}</span>
                {localized(cat.title, locale)}
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {cat.items.map((item) => (
                  <a
                    key={item.url}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col rounded-xl border border-border bg-elevated/50 p-4 transition hover:border-accent hover:shadow-md"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-primary transition group-hover:text-accent">
                        {item.name}
                      </span>
                      <span className="flex items-center gap-1 shrink-0">
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                            item.free === "free"
                              ? "bg-dim-language/15 text-dim-language"
                              : "bg-dim-holiday/15 text-dim-holiday"
                          }`}
                        >
                          {item.free === "free" ? t("resources.free") : t("resources.freemium")}
                        </span>
                        <ExternalLink
                          size={14}
                          className="text-muted transition group-hover:text-accent"
                        />
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-secondary">
                      {localized(item.desc, locale)}
                    </p>
                  </a>
                ))}
              </div>
            </motion.section>
          ))}
        </div>

        <p className="mt-12 text-xs leading-relaxed text-muted">{t("resources.disclaimer")}</p>
      </div>
    </div>
  );
}
