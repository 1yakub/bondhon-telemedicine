"use client";

import { Suspense, use, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Video } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { OnlineDot, StatusBadge } from "@/components/status-badge";
import { VisitSteps } from "@/components/visit-steps";
import { toApiError } from "@/lib/api";
import { initials, money, when } from "@/lib/format";
import { useCancelConsultation, useConsultation, useStartPayment } from "@/lib/queries";

export default function VisitPage({ params }: PageProps<"/visits/[id]">) {
  const { id } = use(params);
  return (
    <Suspense>
      <Visit id={id} />
    </Suspense>
  );
}

function Visit({ id }: { id: string }) {
  const t = useTranslations("visits");
  const router = useRouter();
  const search = useSearchParams();
  const paymentResult = search.get("payment");
  const { data: visit, isPending, isError, refetch } = useConsultation(id);
  const pay = useStartPayment(id);
  const cancel = useCancelConsultation(id);

  // the payment return lands here: say what happened once, then clean the URL
  useEffect(() => {
    if (!paymentResult) return;
    if (paymentResult === "paid") toast.success(t("paymentPaid"));
    else if (paymentResult === "cancelled") toast.info(t("paymentCancelled"));
    else toast.error(t("paymentFailed"));
    refetch();
    router.replace(`/visits/${id}`);
  }, [paymentResult, id, refetch, router, t]);

  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (isError || !visit) {
    return (
      <div className="py-16 text-center">
        <p>{t("notFound")}</p>
        <Button className="mt-4" variant="outline" render={<Link href="/visits" />}>
          {t("title")}
        </Button>
      </div>
    );
  }

  const startPayment = async () => {
    try {
      const { payment_url } = await pay.mutateAsync();
      window.location.assign(payment_url);
    } catch (err) {
      toast.error(toApiError(err).message);
    }
  };

  const doctorOnline = !!visit.doctor?.is_online;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            {t("visit")} #{visit.id} {"·"} {t("bookedOn", { date: when(visit.created_at) })}
          </p>
          <h1 className="text-2xl font-bold tracking-tight">{t("with", { name: visit.doctor?.name ?? "" })}</h1>
        </div>
        <StatusBadge status={visit.status} />
      </div>

      <VisitSteps status={visit.status} />

      {/* the one thing to do right now */}
      <Card>
        <CardContent className="space-y-4">
          {visit.status === "pending" && (
            <>
              <p className="text-muted-foreground">{t("payBody")}</p>
              <div className="flex flex-wrap gap-3">
                <Button className="h-11 px-6 text-base" onClick={startPayment} disabled={pay.isPending}>
                  {pay.isPending ? t("paying") : t("payNow", { amount: money(visit.amount) })}
                </Button>
                <Button
                  variant="ghost"
                  disabled={cancel.isPending}
                  onClick={() =>
                    cancel.mutate(undefined, {
                      onSuccess: () => {
                        toast.success(t("cancelled"));
                        router.push("/visits");
                      },
                      onError: (err) => toast.error(toApiError(err).message),
                    })
                  }
                >
                  {t("cancel")}
                </Button>
              </div>
            </>
          )}

          {visit.status === "confirmed" && (
            <>
              <p className={doctorOnline ? "text-ok" : "text-muted-foreground"}>
                <OnlineDot online={doctorOnline} className="mr-2" />
                {doctorOnline ? t("doctorOnline") : t("waitingDoctor")}
              </p>
              {doctorOnline && (
                <Button className="h-11 px-6 text-base" render={<Link href={`/visits/${visit.id}/call`} />}>
                  <Video data-icon="inline-start" />
                  {t("joinCall")}
                </Button>
              )}
            </>
          )}

          {visit.status === "in_progress" && (
            <>
              <p className="text-muted-foreground">{t("inProgress")}</p>
              <Button className="h-11 px-6 text-base" render={<Link href={`/visits/${visit.id}/call`} />}>
                <Video data-icon="inline-start" />
                {t("rejoinCall")}
              </Button>
            </>
          )}

          {visit.status === "completed" && (
            <>
              <p className="font-medium">{t("doneTitle")}</p>
              {visit.duration_minutes != null && <p className="text-muted-foreground">{t("duration", { minutes: visit.duration_minutes })}</p>}
              <Button variant="outline" render={<Link href="/doctors" />}>
                {t("bookAgain")}
              </Button>
            </>
          )}

          {visit.status === "cancelled" && (
            <Alert variant="destructive">
              <AlertDescription>{t("paymentFailed")}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{visit.doctor?.name}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-start gap-4">
            <Avatar className="size-12">
              <AvatarFallback className="bg-accent text-accent-foreground">{initials(visit.doctor?.name)}</AvatarFallback>
            </Avatar>
            <div className="text-sm">
              <p>{visit.doctor?.specialization ?? "General practice"}</p>
              {visit.doctor?.qualifications && <p className="text-muted-foreground">{visit.doctor.qualifications}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("payment")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-semibold">{money(visit.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className="capitalize">{visit.payment_status}</span>
            </div>
            {visit.payment?.transaction_id && (
              <>
                <Separator />
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">{t("transaction")}</span>
                  <span className="truncate font-mono text-xs">{visit.payment.transaction_id}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {visit.patient_symptoms && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("symptoms")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line">{visit.patient_symptoms}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
