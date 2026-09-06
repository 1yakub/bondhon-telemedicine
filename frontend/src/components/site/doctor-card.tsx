import Link from "next/link";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { OnlineDot } from "@/components/status-badge";
import { initials, money } from "@/lib/format";
import type { Doctor } from "@/lib/types";

export function DoctorCard({ doctor }: { doctor: Doctor }) {
  const t = useTranslations("doctors");
  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col gap-4">
        <div className="flex items-start gap-4">
          <Avatar className="size-14 text-base">
            <AvatarFallback className="bg-accent text-accent-foreground">{initials(doctor.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-semibold">{doctor.name}</h3>
            <p className="text-sm text-muted-foreground">{doctor.specialization ?? "General practice"}</p>
            <p className="mt-1 flex items-center gap-2 text-sm">
              <OnlineDot online={doctor.is_online} />
              <span className={doctor.is_online ? "text-ok" : "text-muted-foreground"}>
                {doctor.is_online ? t("online") : t("offline")}
              </span>
            </p>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <dt className="text-muted-foreground">{t("fee")}</dt>
            <dd className="font-semibold">{money(doctor.fee_per_consultation)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Experience</dt>
            <dd className="font-semibold">{t("experience", { years: doctor.experience_years ?? 0 })}</dd>
          </div>
        </dl>
        <Button className="mt-auto w-full" variant={doctor.is_online ? "default" : "outline"} render={<Link href={`/doctors/${doctor.id}`} />}>
          {doctor.is_online ? t("book") : t("view")}
        </Button>
      </CardContent>
    </Card>
  );
}
