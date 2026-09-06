import Link from "next/link";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/brand/logo";

export function SiteFooter() {
  const t = useTranslations("nav");
  return (
    <footer className="mt-auto border-t bg-muted/60">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="space-y-2">
          <Logo />
          <p className="max-w-sm text-sm text-muted-foreground">
            Video visits with licensed doctors in Bangladesh. Demo build, data resets nightly.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm" aria-label="Footer">
          <Link className="hover:underline" href="/doctors">
            {t("doctors")}
          </Link>
          <Link className="hover:underline" href="/login">
            {t("signIn")}
          </Link>
          <Link className="hover:underline" href="/doctor/login">
            {t("staff")}
          </Link>
          <a className="hover:underline" href="https://github.com/yakubhossain/bondhon-telemedicine" rel="noreferrer" target="_blank">
            Source
          </a>
        </nav>
      </div>
    </footer>
  );
}
