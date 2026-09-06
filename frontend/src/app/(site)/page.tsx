import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { CreditCard, Stethoscope, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DoctorsPreview } from "@/components/site/doctors-preview";

const demo = process.env.NEXT_PUBLIC_DEMO === "true";

export default async function HomePage() {
  const t = await getTranslations("home");

  const steps = [
    { icon: Stethoscope, title: t("step1Title"), body: t("step1Body") },
    { icon: CreditCard, title: t("step2Title"), body: t("step2Body") },
    { icon: Video, title: t("step3Title"), body: t("step3Body") },
  ];

  return (
    <>
      <section className="mx-auto w-full max-w-6xl px-4 pt-14 pb-10 sm:px-6 sm:pt-20">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <h1 className="text-display font-bold tracking-tight text-balance">{t("heroTitle")}</h1>
            <p className="measure text-lg text-muted-foreground">{t("heroBody")}</p>
            <div className="flex flex-wrap gap-3">
              <Button className="h-11 px-6 text-base" render={<Link href="/doctors" />}>
                {t("findDoctor")}
              </Button>
              <Button variant="outline" className="h-11 px-6 text-base" render={<Link href="/#how" />}>
                {t("howTitle")}
              </Button>
            </div>
            {demo && (
              <Alert className="max-w-xl">
                <AlertTitle>{t("demoTitle")}</AlertTitle>
                <AlertDescription>{t("demoBody")}</AlertDescription>
              </Alert>
            )}
          </div>
          <div className="rounded-3xl bg-mist p-6 sm:p-8">
            <h2 className="mb-4 text-sm font-semibold text-muted-foreground">{t("onlineNow")}</h2>
            <DoctorsPreview />
            <Button variant="link" className="mt-3 px-0" render={<Link href="/doctors" />}>
              {t("seeAll")}
            </Button>
          </div>
        </div>
      </section>

      <section id="how" className="border-t bg-muted/40">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="text-title font-bold tracking-tight">{t("howTitle")}</h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.title} className="rounded-2xl border bg-background p-6">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-full bg-accent text-accent-foreground">
                    <s.icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-semibold text-muted-foreground">Step {i + 1}</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                <p className="mt-1 text-muted-foreground">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
