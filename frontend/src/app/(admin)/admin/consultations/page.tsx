"use client";

import { useTranslations } from "next-intl";
import { PageTitle } from "@/components/app-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { money, when } from "@/lib/format";
import { useAdminConsultations } from "@/lib/queries";

export default function AdminConsultationsPage() {
  const t = useTranslations("admin");
  const { data, isPending } = useAdminConsultations();

  return (
    <>
      <PageTitle title={t("consultations")} />
      {isPending ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>{t("table.patient")}</TableHead>
                <TableHead>{t("table.doctor")}</TableHead>
                <TableHead>{t("table.date")}</TableHead>
                <TableHead className="text-right">{t("table.amount")}</TableHead>
                <TableHead>{t("table.payment")}</TableHead>
                <TableHead>{t("table.status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data ?? []).map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="text-muted-foreground">{c.id}</TableCell>
                  <TableCell className="font-medium">
                    {c.patient_name ?? "-"}
                    <span className="block text-xs text-muted-foreground">{c.patient_phone}</span>
                  </TableCell>
                  <TableCell>
                    {c.doctor_name}
                    <span className="block text-xs text-muted-foreground">{c.doctor_specialization}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{when(c.created_at)}</TableCell>
                  <TableCell className="text-right">{money(c.fee_amount)}</TableCell>
                  <TableCell className="capitalize">{c.payment_status}</TableCell>
                  <TableCell>
                    <StatusBadge status={c.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
