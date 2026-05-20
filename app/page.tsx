"use client";

import { BadgeCheck, Lock, MousePointerClick, ShieldCheck, Sparkles } from "lucide-react";
import { CompressionLevelSelector } from "@/components/CompressionLevelSelector";
import { Dropzone } from "@/components/Dropzone";
import { EngineSelector } from "@/components/EngineSelector";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ProgressPanel } from "@/components/ProgressPanel";
import { useI18n } from "@/hooks/useI18n";
import { usePdfCompressor } from "@/hooks/usePdfCompressor";

export default function Home() {
  const { job, stage, engine, selectedEngine, setSelectedEngine, level, setLevel, addFile, start, cancel, reset } =
    usePdfCompressor();
  const { locale, setLocale, t } = useI18n();
  const isBusy = job?.status === "processing" || job?.status === "validating";

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex items-center justify-between gap-4">
          <a href="#compressor" className="flex items-center gap-3 rounded-full focus:outline-none focus:ring-2 focus:ring-mint">
            <span className="inline-flex size-9 items-center justify-center rounded-full bg-ink text-sm font-bold text-white">
              z
            </span>
            <span className="text-sm font-semibold text-ink">zipdf</span>
          </a>
          <div className="flex items-center gap-2">
            <LanguageSwitcher locale={locale} onChange={setLocale} t={t.language} />
          </div>
        </header>

        <section className="grid gap-6 py-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-1.5 text-xs font-medium text-black/62">
              <ShieldCheck aria-hidden="true" size={14} />
              {t.hero.localBadge}
            </div>
            <h1 className="text-4xl font-semibold tracking-normal text-ink sm:text-5xl lg:text-6xl">
              {t.hero.title}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-black/64">{t.hero.description}</p>
            <p className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-ink">
              <Lock aria-hidden="true" size={16} />
              {t.hero.privacy}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <TrustCard icon={<BadgeCheck size={18} />} title={t.hero.trust[0].title} text={t.hero.trust[0].text} />
            <TrustCard icon={<Sparkles size={18} />} title={t.hero.trust[1].title} text={t.hero.trust[1].text} />
            <TrustCard icon={<MousePointerClick size={18} />} title={t.hero.trust[2].title} text={t.hero.trust[2].text} />
          </div>
        </section>

        <section id="compressor" className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-5">
            <Dropzone onFile={addFile} disabled={isBusy} t={t.dropzone} privacyText={t.hero.privacy} />
            <CompressionLevelSelector value={level} onChange={setLevel} disabled={isBusy} t={t.compression} />
            <EngineSelector value={selectedEngine} onChange={setSelectedEngine} disabled={isBusy} t={t.engines} />
          </div>
          <div className="space-y-5">
            <ProgressPanel
              job={job}
              stage={stage}
              engine={engine}
              onStart={start}
              onCancel={cancel}
              onReset={reset}
              t={t}
            />
          </div>
        </section>

        <footer className="flex flex-col gap-2 border-t border-black/10 py-6 text-sm text-black/56 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} zipdf</p>
          <p>
            {t.footer.developedBy}{" "}
            <a
              href="https://www.upscrum.com.br/"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-ink underline-offset-4 transition hover:text-mint hover:underline focus:outline-none focus:ring-2 focus:ring-mint"
            >
              UpScrum Systems
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}

function TrustCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <article className="rounded-lg border border-black/10 bg-white/72 p-4">
      <div className="text-mint">{icon}</div>
      <h2 className="mt-3 text-sm font-semibold text-ink">{title}</h2>
      <p className="mt-1 text-xs leading-5 text-black/58">{text}</p>
    </article>
  );
}
