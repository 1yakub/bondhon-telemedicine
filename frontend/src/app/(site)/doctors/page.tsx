"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { DoctorCard } from "@/components/site/doctor-card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useDoctors } from "@/lib/queries";

export default function DoctorsPage() {
  const t = useTranslations("doctors");
  const { data, isPending } = useDoctors();
  const [specialty, setSpecialty] = useState<string>("all");
  const [onlineOnly, setOnlineOnly] = useState(false);

  const specialties = useMemo(
    () => Array.from(new Set((data ?? []).map((d) => d.specialization ?? "General practice"))).sort(),
    [data],
  );

  const list = (data ?? [])
    .filter((d) => specialty === "all" || (d.specialization ?? "General practice") === specialty)
    .filter((d) => !onlineOnly || d.is_online)
    .sort((a, b) => Number(b.is_online) - Number(a.is_online) || a.name.localeCompare(b.name));

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-title font-bold tracking-tight">{t("title")}</h1>
          <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={specialty} onValueChange={(v) => setSpecialty(v ?? "all")}>
            <SelectTrigger className="min-w-48" aria-label="Specialty">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filterAll")}</SelectItem>
              {specialties.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant={onlineOnly ? "default" : "outline"} onClick={() => setOnlineOnly((v) => !v)} aria-pressed={onlineOnly}>
            {t("onlineOnly")}
          </Button>
        </div>
      </div>

      {isPending ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-56 w-full" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <p className="mt-12 text-center text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((d) => (
            <li key={d.id}>
              <DoctorCard doctor={d} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
