import { getRequestConfig } from "next-intl/server";

/**
 * next-intl "without i18n routing": one locale today, every visible string in
 * messages/<locale>.json. A second locale (bn) only needs its JSON file and a
 * cookie based switch here, per the next-intl docs; URLs do not change.
 */
export default getRequestConfig(async () => {
  const locale = "en";

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
