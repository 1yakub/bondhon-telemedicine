"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarDays, UserRound } from "lucide-react";
import AppShell, { ShellLoading } from "../../components/app/AppShell";
import useAuthUser from "../../components/app/useAuthUser";

const nav = [
  { href: "/doctor/dashboard", label: "Today", Icon: LayoutDashboard },
  { href: "/doctor/consultations", label: "Visits", Icon: CalendarDays },
  { href: "/doctor/profile", label: "Profile", Icon: UserRound },
];

function OnlineSwitch({ user, setUser }) {
  const [busy, setBusy] = useState(false);
  const online = !!user?.doctor?.is_online;
  const toggle = async () => {
    setBusy(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/doctors/toggle-status`, { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json", Accept: "application/json" } });
      if (res.ok) {
        const data = await res.json();
        setUser({ ...user, doctor: { ...user.doctor, is_online: data.is_online ?? data.doctor?.is_online ?? !online } });
      }
    } finally { setBusy(false); }
  };
  return (
    <button type="button" role="switch" aria-checked={online} onClick={toggle} disabled={busy}
      className={`tap inline-flex items-center gap-2 rounded-full border px-3 text-sm font-semibold ${online ? "border-teal-100 bg-teal-50 text-teal-700" : "border-rule bg-paper text-slate"} disabled:opacity-60`}>
      <span className={`h-2.5 w-2.5 rounded-full ${online ? "bg-teal-500" : "bg-slate-2"}`} />
      {online ? "Online" : "Offline"}
    </button>
  );
}

export default function DoctorLayout({ children }) {
  const pathname = usePathname();
  const isLogin = pathname === "/doctor/login";
  const { user, setUser, loading, logout } = useAuthUser("doctor", "/doctor/login", { skip: isLogin });
  if (isLogin) return children;
  if (loading) return <ShellLoading />;
  if (!user) return null;
  return (
    <AppShell home="/doctor/dashboard" nav={nav} name={"Dr. " + user.name.replace(/^(Dr\.?\s*)+/i, "")} roleLabel={user.doctor?.specialization || "Doctor"} onLogout={logout}
      actions={<OnlineSwitch user={user} setUser={setUser} />}>
      {children}
    </AppShell>
  );
}
