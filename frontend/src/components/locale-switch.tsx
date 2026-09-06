"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LOCALE_COOKIE, localeNames, locales, type Locale } from "@/i18n/config";

/** One tap switches the whole app between English and Bangla; the choice lives in a cookie. */
export function LocaleSwitch({ className }: { className?: string }) {
  const current = useLocale() as Locale;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const next = locales.find((l) => l !== current) ?? current;

  const change = () => {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.refresh());
  };

  return (
    <Button variant="ghost" size="sm" className={className} onClick={change} disabled={pending} lang={next} aria-label={`Switch language to ${next === "bn" ? "Bangla" : "English"}`}>
      <Languages data-icon="inline-start" />
      {localeNames[next]}
    </Button>
  );
}
