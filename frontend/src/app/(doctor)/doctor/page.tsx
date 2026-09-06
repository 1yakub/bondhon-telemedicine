"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ChevronRight, Video } from "lucide-react";
import { PageTitle, StatCard } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { OnlineDot, StatusBadge } from "@/components/status-badge";
import { toApiError } from "@/lib/api";
import { money, when } from "@/lib/format";
import { useConsultations, useDoctorStats, useToggleOnline, useUser } from "@/lib/queries";
import type { Consultation } from "@/lib/types";

export default function DoctorTodayPage() {
  const t = useTranslations("doctor");
  const { data: user } = useUser();
  const { data: stats } = useDoctorStats();
  const { data: visits, isPending } = useConsultations();
  const toggle = useToggleOnline();
  const online = !!user?.doctor?.is_online;

  const groups: { key: string; title: string; items: Consultation[]; primary?: boolean }[] = [
    { key: "ready", title: t("ready"), items: (visits ?? []).filter((v) => v.status === "confirmed"), primary: true },
    { key: "live", title: t("inProgress"), items: (visits ?? []).filter((v) => v.status === "in_progress"), primary: true },
    { key: "pending", title: t("awaitingPayment"), items: (visits ?? []).filter((v) => v.status === "pending") },
    { key: "done", title: t("done"), items: (visits ?? []).filter((v) => v.status === "completed").slice(0, 10) },
  ];

  return (
    <>
      <PageTitle title={t("today")} subtitle={user?.doctor?.specialization ?? undefined} />

      <Card className={online ? "border-primary/40 bg-accent/40" : ""}>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <p className="flex items-center gap-2 font-medium">
            <OnlineDot online={online} />
            {online ? t("online") : t("offline")}
          </p>
          <Button
            variant={online ? "outline" : "default"}
            onClick={() => toggle.mutate(undefined, { onError: (err) => toast.error(toApiError(err).message) })}
            disabled={toggle.isPending}
          >
            {online ? t("goOffline") : t("goOnline")}
          </Button>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t("stats.total")} value={stats?.total_consultations ?? "-"} />
        <StatCard label={t("stats.pending")} value={stats?.pending_consultations ?? "-"} />
        <StatCard label={t("stats.completed")} value={stats?.completed_consultations ?? "-"} />
        <StatCard label={t("stats.earnings")} value={stats ? money(stats.total_earnings) : "-"} />
      </div>

      <div className="mt-8 space-y-8">
        {groups.map((g) => (
          <section key={g.key}>
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground">{g.title}</h2>
            {isPending ? (
              <Skeleton className="h-20 w-full" />
            ) : g.items.length === 0 ? (
              <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                {g.key === "ready" ? t("readyEmpty") : "-"}
              </p>
            ) : (
              <ul className="divide-y rounded-2xl border bg-card">
                {g.items.map((v) => (
                  <li key={v.id}>
                    <Link href={`/doctor/visits/${v.id}`} className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/50">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{v.patient?.name ?? "Patient"}</p>
                        <p className="truncate text-sm text-muted-foreground">
                          {v.patient_symptoms || t("noNote")} {"·"} {when(v.created_at)}
                        </p>
                      </div>
                      <StatusBadge status={v.status} />
                      {g.primary ? <Video className="size-4 text-primary" aria-hidden="true" /> : <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </>
  );
}
