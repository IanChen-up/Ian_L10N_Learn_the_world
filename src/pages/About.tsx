import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ArrowLeft, Globe2, Database, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function About() {
  const { t } = useTranslation();
  const features = t("about.features", { returnObjects: true }) as string[];

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
            <Globe2 size={28} />
          </span>
          <h1 className="mt-6 font-display text-4xl font-bold text-primary">
            {t("about.title")}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-secondary">
            {t("about.intro")}
          </p>
        </motion.div>

        <section className="mt-12">
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-primary">
            <Sparkles size={18} className="text-accent" />
            {t("about.featuresTitle")}
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {features.map((f, i) => (
              <li
                key={i}
                className="rounded-xl border border-border bg-elevated/50 px-4 py-3 text-sm text-secondary"
              >
                {f}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-primary">
            <Database size={18} className="text-accent" />
            {t("about.dataTitle")}
          </h2>
          <p className="mt-4 leading-relaxed text-secondary">{t("about.dataDesc")}</p>
          <p className="mt-4 text-sm text-muted">{t("about.disclaimer")}</p>
        </section>
      </div>
    </div>
  );
}
