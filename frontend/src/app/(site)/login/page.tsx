"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { api, toApiError } from "@/lib/api";
import { keys } from "@/lib/queries";
import type { User } from "@/lib/types";

const phoneSchema = z.object({
  phone: z.string().trim().regex(/^(\+?88)?01[3-9][0-9]{8}$/, "Enter a valid Bangladesh mobile number, like 01712345678."),
});
const codeSchema = z.object({ otp: z.string().trim().regex(/^[0-9]{6}$/, "Enter the 6 digit code.") });

export default function LoginPage() {
  return (
    <Suspense>
      <PatientLogin />
    </Suspense>
  );
}

function PatientLogin() {
  const t = useTranslations("login");
  const router = useRouter();
  const qc = useQueryClient();
  const next = useSearchParams().get("next") || "/visits";
  const [phone, setPhone] = useState<string | null>(null);
  const [demoCode, setDemoCode] = useState<string | null>(null);

  const phoneForm = useForm<z.infer<typeof phoneSchema>>({ resolver: zodResolver(phoneSchema), defaultValues: { phone: "" } });
  const codeForm = useForm<z.infer<typeof codeSchema>>({ resolver: zodResolver(codeSchema), defaultValues: { otp: "" } });

  const send = useMutation({
    mutationFn: async (p: string) => (await api.post<{ phone: string; demo_code: string | null }>("/auth/send-otp", { phone: p })).data,
    onSuccess: (data) => {
      setPhone(data.phone);
      setDemoCode(data.demo_code);
      codeForm.reset();
    },
    onError: (err) => phoneForm.setError("phone", { message: toApiError(err).message }),
  });

  const verify = useMutation({
    mutationFn: async (otp: string) => (await api.post<{ user: User }>("/auth/verify-otp", { phone, otp })).data.user,
    onSuccess: (user) => {
      qc.setQueryData(keys.user, user);
      router.replace(user.profile_complete ? next : `/account?next=${encodeURIComponent(next)}`);
    },
    onError: (err) => codeForm.setError("otp", { message: toApiError(err).message }),
  });

  return (
    <div className="mx-auto w-full max-w-md px-4 py-12 sm:px-6">
      <Card>
        {phone === null ? (
          <>
            <CardHeader>
              <CardTitle className="text-xl">{t("title")}</CardTitle>
              <CardDescription>{t("body")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={phoneForm.handleSubmit((v) => send.mutate(v.phone))}>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t("phone")}</Label>
                  <Input id="phone" type="tel" inputMode="numeric" autoComplete="tel" placeholder={t("phonePlaceholder")} autoFocus {...phoneForm.register("phone")} />
                  {phoneForm.formState.errors.phone && <p className="text-sm text-destructive">{phoneForm.formState.errors.phone.message}</p>}
                </div>
                <Button type="submit" className="h-11 w-full text-base" disabled={send.isPending}>
                  {t("sendCode")}
                </Button>
              </form>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader>
              <CardTitle className="text-xl">{t("codeTitle")}</CardTitle>
              <CardDescription>{t("codeBody", { phone })}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {demoCode && (
                <Alert>
                  <AlertDescription>{t("demoCode", { code: demoCode })}</AlertDescription>
                </Alert>
              )}
              <form className="space-y-4" onSubmit={codeForm.handleSubmit((v) => verify.mutate(v.otp))}>
                <div className="space-y-2">
                  <Label htmlFor="otp">{t("code")}</Label>
                  <Input id="otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} className="text-center text-2xl tracking-[0.5em]" autoFocus {...codeForm.register("otp")} />
                  {codeForm.formState.errors.otp && <p className="text-sm text-destructive">{codeForm.formState.errors.otp.message}</p>}
                </div>
                <Button type="submit" className="h-11 w-full text-base" disabled={verify.isPending}>
                  {t("verify")}
                </Button>
              </form>
              <div className="flex justify-between text-sm">
                <Button variant="link" className="px-0" onClick={() => setPhone(null)}>
                  {t("changeNumber")}
                </Button>
                <Button variant="link" className="px-0" disabled={send.isPending} onClick={() => send.mutate(phone)}>
                  {t("resend")}
                </Button>
              </div>
            </CardContent>
          </>
        )}
      </Card>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link className="underline" href="/doctor/login">
          {t("doctorLink")}
        </Link>
        {" · "}
        <Link className="underline" href="/admin/login">
          {t("adminLink")}
        </Link>
      </p>
    </div>
  );
}
