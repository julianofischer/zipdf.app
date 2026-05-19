"use client";

import { Languages } from "lucide-react";
import { LOCALES, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

type Props = {
  locale: Locale;
  onChange: (locale: Locale) => void;
  t: Dictionary["language"];
};

export function LanguageSwitcher({ locale, onChange, t }: Props) {
  return (
    <label className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-2 text-sm text-ink shadow-sm">
      <Languages aria-hidden="true" size={16} />
      <span className="sr-only">{t.label}</span>
      <select
        value={locale}
        onChange={(event) => onChange(event.target.value as Locale)}
        className="border-0 bg-transparent p-0 text-sm font-medium text-inherit focus:ring-0"
        aria-label={t.label}
      >
        {LOCALES.map((item) => (
          <option key={item} value={item}>
            {item === "pt-BR" ? t.portuguese : t.english}
          </option>
        ))}
      </select>
    </label>
  );
}
