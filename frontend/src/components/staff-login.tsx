"use client";

import { Suspense } from "react";
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
import { homePathFor } from "@/components/require-role";
import type { User } from "@/lib/types";

const schema = z.object({
  email: z.email("Enter your email address."),
  password: z.string().min(1, "Enter your password."),
});
type Values = z.infer<typeof schema>;

const demo = process.env.NEXT_PUBLIC_DEMO === "true";

export function StaffLogin({ role }: { role: "doctor" | "admin" }) {
  return (
    <Suspense>
      <StaffLoginForm role={role} />
    </Suspense>
  );
}

function StaffLoginForm({ role }: { role: "doctor" | "admin" }) {
  const t = useTranslations("login");
  const router = useRouter();
  const qc = useQueryClient();
  const next = useSearchParams().get("next") || homePathFor[role];

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: demo && role === "doctor" ? { email: "ahmed@bondhon.com", password: "" } : { email: "", password: "" },
  });

  const login = useMutation({
    mutationFn: async (values: Values) => (await api.post<{ user: User }>(`/auth/${role}/login`, values)).data.user,
    onSuccess: (user) => {
      qc.setQueryData(keys.user, user);
      router.replace(next);
    },
    onError: (err) => form.setError("root", { message: toApiError(err).message }),
  });

  return (
    <div className="mx-auto w-full max-w-md px-4 py-12 sm:px-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{role === "doctor" ? t("doctorTitle") : t("adminTitle")}</CardTitle>
          <CardDescription>{t("staffTitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {demo && role === "doctor" && (
            <Alert>
              <AlertDescription>
                {t("demoDoctor")}: ahmed@bondhon.com, password doctor123
              </AlertDescription>
            </Alert>
          )}
          <form className="space-y-4" onSubmit={form.handleSubmit((v) => login.mutate(v))}>
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input id="email" type="email" autoComplete="username" {...form.register("email")} />
              {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("password")}</Label>
              <Input id="password" type="password" autoComplete="current-password" {...form.register("password")} />
              {form.formState.errors.password && <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>}
            </div>
            {form.formState.errors.root && <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>}
            <Button type="submit" className="h-11 w-full text-base" disabled={login.isPending}>
              {t("signIn")}
            </Button>
          </form>
        </CardContent>
      </Card>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link className="underline" href="/login">
          {t("patientLink")}
        </Link>
        {" · "}
        <Link className="underline" href={role === "doctor" ? "/admin/login" : "/doctor/login"}>
          {role === "doctor" ? t("adminLink") : t("doctorLink")}
        </Link>
      </p>
    </div>
  );
}
