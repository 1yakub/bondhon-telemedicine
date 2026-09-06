"use client";

import { useTranslations } from "next-intl";
import { PageTitle, StatCard } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { money, month } from "@/lib/format";
import { useAdminAnalytics, useAdminStats } from "@/lib/queries";

export default function AdminOverviewPage() {
  const t = useTranslations("admin");
  const ts = useTranslations("status");
  const { data: stats } = useAdminStats();
  const { data: analytics, isPending } = useAdminAnalytics();

  const maxMonth = Math.max(1, ...(analytics?.consultations_by_month.map((m) => m.count) ?? [1]));
  const maxRevenue = Math.max(1, ...(analytics?.revenue_by_month.map((m) => Number(m.total)) ?? [1]));

  return (
    <>
      <PageTitle title={t("overview")} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t("stats.doctors")} value={stats?.total_doctors ?? "-"} hint={stats ? `${stats.online_doctors} ${t("stats.onlineDoctors")}` : undefined} />
        <StatCard label={t("stats.patients")} value={stats?.total_patients ?? "-"} />
        <StatCard label={t("stats.consultations")} value={stats?.total_consultations ?? "-"} hint={stats ? `${stats.pending_consultations} ${t("stats.pending")}` : undefined} />
        <StatCard label={t("stats.revenue")} value={stats ? money(stats.total_revenue) : "-"} />
      </div>

      {isPending || !analytics ? (
        <Skeleton className="mt-6 h-64 w-full" />
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("byStatus")}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2">
                {Object.entries(analytics.consultations_by_status).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between text-sm">
                    <dt className="text-muted-foreground">{status === "paid" ? ts("confirmed") : status === "failed" ? ts("cancelled") : ts("pending")}</dt>
                    <dd className="font-semibold">{count}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("topDoctors")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2">
                {analytics.top_doctors.map((d, i) => (
                  <li key={`${d.doctor_name}-${i}`} className="flex items-center justify-between text-sm">
                    <span>
                      <span className="mr-2 text-muted-foreground">{i + 1}.</span>
                      {d.doctor_name ?? "-"}
                    </span>
                    <span className="font-semibold">{d.consultation_count}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <Bars title={t("byMonth")} rows={analytics.consultations_by_month.map((m) => ({ label: month(m.month), value: m.count, text: String(m.count) }))} max={maxMonth} />
          <Bars title={t("revenueByMonth")} rows={analytics.revenue_by_month.map((m) => ({ label: month(m.month), value: Number(m.total), text: money(m.total) }))} max={maxRevenue} />
        </div>
      )}
    </>
  );
}

function Bars({ title, rows, max }: { title: string; rows: { label: string; value: number; text: string }[]; max: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">-</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((r) => (
              <li key={r.label} className="grid grid-cols-[6rem_1fr_auto] items-center gap-3 text-sm">
                <span className="text-muted-foreground">{r.label}</span>
                <span className="h-2 rounded-full bg-muted">
                  <span className="block h-2 rounded-full bg-primary" style={{ width: `${Math.max(2, (r.value / max) * 100)}%` }} />
                </span>
                <span className="font-semibold tabular-nums">{r.text}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
