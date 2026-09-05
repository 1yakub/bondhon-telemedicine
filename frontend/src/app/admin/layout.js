"use client";

import { usePathname } from "next/navigation";
import { LayoutDashboard, Stethoscope, Users, CalendarDays } from "lucide-react";
import AppShell, { ShellLoading } from "../../components/app/AppShell";
import useAuthUser from "../../components/app/useAuthUser";

const nav = [
  { href: "/admin/dashboard", label: "Overview", Icon: LayoutDashboard },
  { href: "/admin/doctors", label: "Doctors", Icon: Stethoscope },
  { href: "/admin/patients", label: "Patients", Icon: Users },
  { href: "/admin/consultations", label: "Visits", Icon: CalendarDays },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const isLogin = pathname === "/admin/login";
  const { user, loading, logout } = useAuthUser("admin", "/admin/login", { skip: isLogin });
  if (isLogin) return children;
  if (loading) return <ShellLoading />;
  if (!user) return null;
  return (
    <AppShell home="/admin/dashboard" nav={nav} name={user.name} roleLabel="Admin" onLogout={logout}>
      {children}
    </AppShell>
  );
}
