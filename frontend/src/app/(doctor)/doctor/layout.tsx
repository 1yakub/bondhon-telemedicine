"use client";

import { useTranslations } from "next-intl";
import { CalendarClock, UserRound } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { RequireRole } from "@/components/require-role";

export default function DoctorLayout({ children }: LayoutProps<"/doctor">) {
  const t = useTranslations("doctor");
  return (
    <RequireRole role="doctor">
      {(user) => (
        <AppShell
          user={user}
          items={[
            { href: "/doctor", label: t("today"), icon: CalendarClock, exact: true },
            { href: "/doctor/account", label: t("account"), icon: UserRound },
          ]}
        >
          {children}
        </AppShell>
      )}
    </RequireRole>
  );
}
