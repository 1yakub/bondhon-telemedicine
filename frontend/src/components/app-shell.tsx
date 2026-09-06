"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { LogOut, type LucideIcon } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { LocaleSwitch } from "@/components/locale-switch";
import { Button } from "@/components/ui/button";
import { OnlineDot } from "@/components/status-badge";
import { useLogout } from "@/lib/queries";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/types";

export type NavItem = { href: string; label: string; icon: LucideIcon; exact?: boolean };

/**
 * Frame for the signed in areas: top bar with the wordmark and sign out, a nav strip that
 * becomes a sidebar on wide screens, and the page body. One component for all three roles.
 */
export function AppShell({ user, items, children }: { user: User; items: NavItem[]; children: React.ReactNode }) {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const pathname = usePathname();
  const router = useRouter();
  const logout = useLogout();

  const isActive = (item: NavItem) => (item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/"));

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo href={items[0]?.href ?? "/"} />
          <div className="flex items-center gap-3">
            <LocaleSwitch />
            <div className="hidden items-center gap-2 text-sm sm:flex">
              {user.role === "doctor" && <OnlineDot online={!!user.doctor?.is_online} />}
              <span className="max-w-40 truncate font-medium">{user.name ?? user.phone}</span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground capitalize">{user.role}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => logout.mutate(undefined, { onSuccess: () => router.push("/") })}
              disabled={logout.isPending}
            >
              <LogOut data-icon="inline-start" />
              {t("signOut")}
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 md:flex-row">
        <nav className="flex gap-1 overflow-x-auto md:w-52 md:flex-col md:overflow-visible" aria-label={tc("areaNav")}>
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item) ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive(item) ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="size-4" aria-hidden="true" />
              {item.label}
            </Link>
          ))}
        </nav>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-bold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}
