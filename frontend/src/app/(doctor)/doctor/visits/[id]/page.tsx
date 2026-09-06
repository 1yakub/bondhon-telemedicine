"use client";

import { use } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";
import { VisitSteps } from "@/components/visit-steps";
import { money, when } from "@/lib/format";
import { useConsultation } from "@/lib/queries";

export default function DoctorVisitPage({ params }: PageProps<"/doctor/visits/[id]">) {
  const { id } = use(params);
  const t = useTranslations("doctor");
  const tc = useTranslations("common");
  const tv = useTranslations("visits");
  const { data: visit, isPending, isError } = useConsultation(id);

  if (isPending) return <Skeleton className="h-64 w-full" />;
  if (isError || !visit) {
    return (
      <div className="py-16 text-center">
        <p>{tv("notFound")}</p>
        <Button className="mt-4" variant="outline" render={<Link href="/doctor" />}>
          {t("today")}
        </Button>
      </div>
    );
  }

  const canCall = visit.status === "confirmed" || visit.status === "in_progress";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            {tv("visit")} #{visit.id} {"·"} {when(visit.created_at)}
          </p>
          <h1 className="text-2xl font-bold tracking-tight">{visit.patient?.name ?? t("patient")}</h1>
        </div>
        <StatusBadge status={visit.status} />
      </div>

      <VisitSteps status={visit.status} />

      {canCall && (
        <Card className="border-primary/40 bg-accent/40">
          <CardContent className="flex flex-wrap items-center justify-between gap-4">
            <p className="font-medium">{visit.status === "in_progress" ? tv("inProgress") : t("readyToStart")}</p>
            <Button className="h-11 px-6 text-base" render={<Link href={`/doctor/visits/${visit.id}/call`} />}>
              <Video data-icon="inline-start" />
              {visit.status === "in_progress" ? tv("rejoinCall") : t("startCall")}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("patient")}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
              <dt className="text-muted-foreground">{tc("name")}</dt>
              <dd>{visit.patient?.name ?? "-"}</dd>
              <dt className="text-muted-foreground">{tc("age")}</dt>
              <dd>{visit.patient?.age ?? "-"}</dd>
              <dt className="text-muted-foreground">{tc("gender")}</dt>
              <dd className="capitalize">{visit.patient?.gender ?? "-"}</dd>
              <dt className="text-muted-foreground">{tc("phone")}</dt>
              <dd>{visit.patient?.phone ?? "-"}</dd>
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{tv("payment")}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
              <dt className="text-muted-foreground">{tc("fee")}</dt>
              <dd className="font-semibold">{money(visit.amount)}</dd>
              <dt className="text-muted-foreground">{tc("status")}</dt>
              <dd className="capitalize">{visit.payment_status}</dd>
              {visit.ended_at && visit.duration_minutes != null && (
                <>
                  <dt className="text-muted-foreground">{tc("duration")}</dt>
                  <dd>{tv("duration", { minutes: visit.duration_minutes })}</dd>
                </>
              )}
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{tv("symptoms")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-line">{visit.patient_symptoms || t("noNote")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
