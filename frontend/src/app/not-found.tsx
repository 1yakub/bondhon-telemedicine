import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";

export default async function NotFound() {
  const t = await getTranslations("common");
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-24 text-center">
      <Logo />
      <div>
        <h1 className="text-title font-bold tracking-tight">{t("notFoundTitle")}</h1>
        <p className="mt-2 text-muted-foreground">{t("notFoundBody")}</p>
      </div>
      <Button render={<Link href="/" />}>{t("home")}</Button>
    </main>
  );
}
