"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import Logo from "../brand/Logo";

/**
 * Signed in shell for patients, doctors and admins. Desktop: one bar with the links inline.
 * Phone: a slim top bar and a bottom tab bar with icons and short labels, thumbs reach it.
 * `nav` items: { href, label, bn, Icon }. `actions` renders in the top bar (the doctor's online switch).
 */
export default function AppShell({ home, nav, actions = null, name, roleLabel, onLogout, children }) {
  const pathname = usePathname();
  const active = (href) => pathname === href || (href !== home && pathname.startsWith(href));
  return (
    <div className="min-h-screen bg-mist pb-20 md:pb-0">
      <header className="sticky top-0 z-40 border-b border-rule bg-paper">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
          <Logo href={home} />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className={`tap inline-flex items-center gap-2 rounded-control px-4 font-semibold ${active(n.href) ? "bg-teal-50 text-teal-700" : "text-ink-2 hover:bg-mist"}`}>
                <n.Icon className="h-4 w-4" /> {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            {actions}
            <span className="hidden text-right text-sm leading-tight sm:block">
              <span className="block font-semibold text-ink">{name}</span>
              <span className="block text-slate">{roleLabel}</span>
            </span>
            <button type="button" onClick={onLogout} className="tap inline-flex items-center gap-2 rounded-control border border-rule px-3 text-sm font-semibold text-ink-2 hover:border-teal-600 hover:text-teal-700" aria-label="Sign out">
              <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-6 md:py-8">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-paper md:hidden" aria-label="Main">
        <ul className="grid" style={{ gridTemplateColumns: `repeat(${nav.length}, minmax(0, 1fr))` }}>
          {nav.map((n) => (
            <li key={n.href}>
              <Link href={n.href} className={`flex h-16 flex-col items-center justify-center gap-1 text-xs font-semibold ${active(n.href) ? "text-teal-700" : "text-slate"}`} aria-current={active(n.href) ? "page" : undefined}>
                <n.Icon className={`h-6 w-6 ${active(n.href) ? "text-teal-600" : ""}`} />
                <span>{n.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

export function ShellLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-mist">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-teal-100 border-t-teal-600" aria-label="Loading" />
    </div>
  );
}
