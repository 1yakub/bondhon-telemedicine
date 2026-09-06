import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { defaultLocale, LOCALE_COOKIE, locales } from "@/i18n/config";

/**
 * next-intl "without i18n routing": the locale comes from a cookie the language switch
 * sets, English by default. URLs never change between languages.
 */
export default getRequestConfig(async () => {
  const requested = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale = hasLocale(locales, requested) ? requested : defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
