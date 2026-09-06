"use client";

import { useTranslations } from "next-intl";
import { CalendarCheck, Stethoscope, UserRound } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { RequireRole } from "@/components/require-role";

export default function PatientLayout({ children }: LayoutProps<"/">) {
  const t = useTranslations("nav");
  return (
    <RequireRole role="patient">
      {(user) => (
        <AppShell
          user={user}
          items={[
            { href: "/visits", label: t("myVisits"), icon: CalendarCheck },
            { href: "/doctors", label: t("doctors"), icon: Stethoscope },
            { href: "/account", label: t("account"), icon: UserRound },
          ]}
        >
          {children}
        </AppShell>
      )}
    </RequireRole>
  );
}
