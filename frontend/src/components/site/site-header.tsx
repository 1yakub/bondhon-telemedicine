"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { LogOut, Menu } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useLogout, useUser } from "@/lib/queries";
import { homePathFor } from "@/components/require-role";

export function SiteHeader() {
  const t = useTranslations("nav");
  const { data: user } = useUser();
  const logout = useLogout();
  const router = useRouter();

  const links = [
    { href: "/doctors", label: t("doctors") },
    { href: "/#how", label: t("howItWorks") },
  ];

  const account = user ? (
    <>
      <Button variant="ghost" render={<Link href={homePathFor[user.role]} />}>
        {user.role === "patient" ? t("myVisits") : t("account")}
      </Button>
      <Button
        variant="outline"
        onClick={() => logout.mutate(undefined, { onSuccess: () => router.push("/") })}
        disabled={logout.isPending}
      >
        <LogOut data-icon="inline-start" />
        {t("signOut")}
      </Button>
    </>
  ) : (
    <>
      <Button variant="ghost" render={<Link href="/doctor/login" />}>
        {t("staff")}
      </Button>
      <Button render={<Link href="/login" />}>{t("signIn")}</Button>
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {links.map((l) => (
            <Button key={l.href} variant="ghost" render={<Link href={l.href} />}>
              {l.label}
            </Button>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">{account}</div>
        <Sheet>
          <SheetTrigger render={<Button variant="outline" size="icon" className="md:hidden" aria-label="Open menu" />}>
            <Menu />
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <nav className="mt-8 flex flex-col gap-2" aria-label="Main">
              {links.map((l) => (
                <Button key={l.href} variant="ghost" className="justify-start" render={<Link href={l.href} />}>
                  {l.label}
                </Button>
              ))}
              <div className="mt-4 flex flex-col gap-2 border-t pt-4">{account}</div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
