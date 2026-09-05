"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import Logo from "../brand/Logo";

const links = [
  { href: "/doctors", en: "Doctors", bn: "ডাক্তার" },
  { href: "/#how", en: "How it works", bn: "কীভাবে কাজ করে" },
  { href: "/doctor/login", en: "For doctors", bn: "ডাক্তারদের জন্য" },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-paper/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Logo />
        <nav className="hidden items-center gap-7 md:flex" aria-label="Main">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-[0.95rem] text-ink-2 hover:text-teal-600">
              {l.en}
            </Link>
          ))}
          <Link href="/login" className="tap inline-flex items-center rounded-control bg-teal-600 px-5 font-semibold text-white hover:bg-teal-700">
            Sign in <span lang="bn" className="ml-2 font-medium opacity-90">লগইন</span>
          </Link>
        </nav>
        <button type="button" onClick={() => setOpen((v) => !v)} className="tap inline-flex w-12 items-center justify-center rounded-control border border-rule md:hidden" aria-expanded={open} aria-controls="mobile-nav" aria-label="Menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <nav id="mobile-nav" className="border-t border-rule bg-paper px-5 py-3 md:hidden" aria-label="Main">
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="tap flex items-center justify-between border-b border-rule text-lg">
              <span>{l.en}</span><span lang="bn" className="text-slate">{l.bn}</span>
            </Link>
          ))}
          <Link href="/login" onClick={() => setOpen(false)} className="tap mt-3 flex items-center justify-center rounded-control bg-teal-600 text-lg font-semibold text-white">
            Sign in <span lang="bn" className="ml-2">লগইন</span>
          </Link>
        </nav>
      )}
    </header>
  );
}
