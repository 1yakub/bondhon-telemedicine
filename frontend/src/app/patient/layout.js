"use client";

import { Home, Stethoscope, CalendarDays, UserRound } from "lucide-react";
import AppShell, { ShellLoading } from "../../components/app/AppShell";
import useAuthUser from "../../components/app/useAuthUser";

const nav = [
  { href: "/patient/dashboard", label: "Home", Icon: Home },
  { href: "/doctors", label: "Doctors", Icon: Stethoscope },
  { href: "/patient/consultations", label: "Visits", Icon: CalendarDays },
  { href: "/patient/profile", label: "Profile", Icon: UserRound },
];

export default function PatientLayout({ children }) {
  const { user, loading, logout } = useAuthUser("patient", "/login");
  if (loading) return <ShellLoading />;
  if (!user) return null;
  return (
    <AppShell home="/patient/dashboard" nav={nav} name={user.name} roleLabel="Patient" onLogout={logout}>
      {children}
    </AppShell>
  );
}
