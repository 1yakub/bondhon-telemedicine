"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { OnlineDot } from "@/components/status-badge";
import { initials, money } from "@/lib/format";
import { useDoctors } from "@/lib/queries";

export function DoctorsPreview() {
  const t = useTranslations("doctors");
  const { data, isPending } = useDoctors();

  if (isPending) {
    return (
      <ul className="space-y-3">
        {[0, 1, 2].map((i) => (
          <li key={i}>
            <Skeleton className="h-14 w-full" />
          </li>
        ))}
      </ul>
    );
  }

  const list = [...(data ?? [])].sort((a, b) => Number(b.is_online) - Number(a.is_online)).slice(0, 4);

  if (list.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;

  return (
    <ul className="divide-y rounded-2xl border bg-background">
      {list.map((d) => (
        <li key={d.id}>
          <Link href={`/doctors/${d.id}`} className="flex items-center gap-3 p-3 transition-colors hover:bg-muted/60">
            <Avatar>
              <AvatarFallback className="bg-accent text-accent-foreground">{initials(d.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{d.name}</p>
              <p className="truncate text-sm text-muted-foreground">{d.specialization ?? "General practice"}</p>
            </div>
            <div className="text-right text-sm">
              <p className="font-semibold">{money(d.fee_per_consultation)}</p>
              <p className="flex items-center justify-end gap-1.5 text-muted-foreground">
                <OnlineDot online={d.is_online} />
                {d.is_online ? t("online") : t("offline")}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
