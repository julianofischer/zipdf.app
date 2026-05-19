"use client";

import { useEffect, useMemo, useState } from "react";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/i18n/config";
import { dictionaries } from "@/i18n/dictionaries";

const STORAGE_KEY = "zipdf.locale";

export function useI18n() {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const browserLocale = window.navigator.language.toLowerCase().startsWith("pt") ? "pt-BR" : "en";
    const nextLocale = isLocale(stored) ? stored : browserLocale;

    document.documentElement.lang = nextLocale;
    window.requestAnimationFrame(() => setLocaleState(nextLocale));
  }, []);

  const setLocale = (nextLocale: Locale) => {
    setLocaleState(nextLocale);
    window.localStorage.setItem(STORAGE_KEY, nextLocale);
    document.documentElement.lang = nextLocale;
  };

  const dictionary = useMemo(() => dictionaries[locale], [locale]);

  return {
    locale,
    setLocale,
    t: dictionary
  };
}
