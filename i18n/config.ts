export const LOCALES = ["pt-BR", "en"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "pt-BR";

export function isLocale(value: string | null): value is Locale {
  return LOCALES.includes(value as Locale);
}
