"use client";

import { useTranslations } from "next-intl";
import { PageTitle } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { day, money } from "@/lib/format";
import { useAdminPatients } from "@/lib/queries";

export default function AdminPatientsPage() {
  const t = useTranslations("admin");
  const { data, isPending } = useAdminPatients();

  return (
    <>
      <PageTitle title={t("patients")} />
      {isPending ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.patient")}</TableHead>
                <TableHead>{t("table.phone")}</TableHead>
                <TableHead>{t("table.joined")}</TableHead>
                <TableHead className="text-right">{t("table.visits")}</TableHead>
                <TableHead className="text-right">{t("table.spent")}</TableHead>
                <TableHead>{t("table.status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data ?? []).map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name ?? <span className="text-muted-foreground">No name yet</span>}</TableCell>
                  <TableCell>{p.phone}</TableCell>
                  <TableCell className="text-muted-foreground">{day(p.registration_date)}</TableCell>
                  <TableCell className="text-right">{p.total_consultations}</TableCell>
                  <TableCell className="text-right">{money(p.total_spent)}</TableCell>
                  <TableCell>
                    <Badge variant={p.status === "active" ? "default" : "outline"}>{p.status}</Badge>
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
