"use client";

import { use } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { OnlineDot } from "@/components/status-badge";
import { BookVisit } from "@/components/site/book-visit";
import { initials, money } from "@/lib/format";
import { useDoctor } from "@/lib/queries";

export default function DoctorPage({ params }: PageProps<"/doctors/[id]">) {
  const { id } = use(params);
  const t = useTranslations("doctors");
  const { data: doctor, isPending, isError } = useDoctor(id);

  if (isPending) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-4 px-4 py-10 sm:px-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !doctor) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-16 text-center sm:px-6">
        <p className="text-lg">{t("notFound")}</p>
        <Button className="mt-4" variant="outline" render={<Link href="/doctors" />}>
          {t("title")}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <div className="grid gap-8 md:grid-cols-[1fr_20rem]">
        <div className="space-y-8">
          <header className="flex items-start gap-5">
            <Avatar className="size-20 text-xl">
              <AvatarFallback className="bg-accent text-accent-foreground">{initials(doctor.name)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-title font-bold tracking-tight">{doctor.name}</h1>
              <p className="text-muted-foreground">{doctor.specialization ?? "General practice"}</p>
              <p className="mt-2 flex items-center gap-2 text-sm">
                <OnlineDot online={doctor.is_online} />
                <span className={doctor.is_online ? "text-ok" : "text-muted-foreground"}>
                  {doctor.is_online ? t("online") : t("offline")}
                </span>
                <span className="text-muted-foreground">
                  {"·"} {t("experience", { years: doctor.experience_years ?? 0 })}
                </span>
              </p>
            </div>
          </header>

          {doctor.qualifications && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground">{t("qualifications")}</h2>
              <p className="mt-1 whitespace-pre-line">{doctor.qualifications}</p>
            </section>
          )}

          <section>
            <h2 className="text-sm font-semibold text-muted-foreground">{t("about")}</h2>
            <p className="mt-1 measure">{t("aboutBody")}</p>
          </section>
        </div>

        <Card className="self-start md:sticky md:top-24">
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">{t("fee")}</p>
              <p className="text-3xl font-bold">{money(doctor.fee_per_consultation)}</p>
            </div>
            {doctor.is_online ? (
              <BookVisit doctor={doctor} />
            ) : (
              <p className="text-sm text-muted-foreground">{t("bookOffline")}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
