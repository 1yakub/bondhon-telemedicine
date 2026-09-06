"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";
import { PageTitle } from "@/components/app-shell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";
import { initials, money, when } from "@/lib/format";
import { useConsultations } from "@/lib/queries";

export default function VisitsPage() {
  const t = useTranslations("visits");
  const { data, isPending } = useConsultations();

  return (
    <>
      <PageTitle
        title={t("title")}
        subtitle={t("subtitle")}
        action={<Button render={<Link href="/doctors" />}>{t("emptyCta")}</Button>}
      />

      {isPending ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-12 text-center">
          <p className="text-muted-foreground">{t("empty")}</p>
          <Button className="mt-4" render={<Link href="/doctors" />}>
            {t("emptyCta")}
          </Button>
        </div>
      ) : (
        <ul className="divide-y rounded-2xl border bg-card">
          {data.map((c) => (
            <li key={c.id}>
              <Link href={`/visits/${c.id}`} className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/50">
                <Avatar>
                  <AvatarFallback className="bg-accent text-accent-foreground">{initials(c.doctor?.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{c.doctor?.name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {c.doctor?.specialization ?? "General practice"} {"·"} {t("bookedOn", { date: when(c.created_at) })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="hidden text-sm font-semibold sm:inline">{money(c.amount)}</span>
                  <StatusBadge status={c.status} />
                  <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
