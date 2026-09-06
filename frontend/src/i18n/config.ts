export const locales = ["en", "bn"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
export const LOCALE_COOKIE = "NEXT_LOCALE";

/** Native names for the switch; the Bangla one is written as escapes so the source stays ASCII. */
export const localeNames: Record<Locale, string> = {
  en: "English",
  bn: "\u09AC\u09BE\u0982\u09B2\u09BE",
};
