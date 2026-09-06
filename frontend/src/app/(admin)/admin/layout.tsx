"use client";

import { useTranslations } from "next-intl";
import { CalendarCheck, LayoutDashboard, Stethoscope, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { RequireRole } from "@/components/require-role";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  const t = useTranslations("admin");
  return (
    <RequireRole role="admin">
      {(user) => (
        <AppShell
          user={user}
          items={[
            { href: "/admin", label: t("overview"), icon: LayoutDashboard, exact: true },
            { href: "/admin/doctors", label: t("doctors"), icon: Stethoscope },
            { href: "/admin/patients", label: t("patients"), icon: Users },
            { href: "/admin/consultations", label: t("consultations"), icon: CalendarCheck },
          ]}
        >
          {children}
        </AppShell>
      )}
    </RequireRole>
  );
}
