"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { PageTitle } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toApiError } from "@/lib/api";
import { useUpdateProfile, useUser } from "@/lib/queries";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(255),
  gender: z.enum(["male", "female", "other", ""]),
  date_of_birth: z.string().optional(),
  address: z.string().trim().max(500).optional(),
});
type Values = z.infer<typeof schema>;

export default function AccountPage() {
  return (
    <Suspense>
      <Account />
    </Suspense>
  );
}

function Account() {
  const t = useTranslations("account");
  const router = useRouter();
  const next = useSearchParams().get("next");
  const { data: user } = useUser();
  const update = useUpdateProfile();
  const firstTime = !user?.profile_complete;

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    values: {
      name: user?.name ?? "",
      gender: (user?.gender ?? "") as Values["gender"],
      date_of_birth: user?.date_of_birth ?? "",
      address: user?.address ?? "",
    },
  });

  const submit = form.handleSubmit(async (v) => {
    try {
      await update.mutateAsync({
        name: v.name,
        gender: v.gender || null,
        date_of_birth: v.date_of_birth || null,
        address: v.address || null,
      });
      toast.success(t("saved"));
      if (next) router.replace(next);
    } catch (err) {
      const e = toApiError(err);
      for (const [field, messages] of Object.entries(e.errors)) form.setError(field as keyof Values, { message: messages[0] });
      if (!Object.keys(e.errors).length) form.setError("root", { message: e.message });
    }
  });

  const err = form.formState.errors;

  return (
    <>
      <PageTitle title={firstTime ? t("completeTitle") : t("title")} subtitle={firstTime ? t("completeBody") : undefined} />
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="text-base">{t("phone")}</CardTitle>
          <CardDescription>{user?.phone}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">{t("name")}</Label>
              <Input id="name" autoComplete="name" autoFocus={firstTime} {...form.register("name")} />
              {err.name && <p className="text-sm text-destructive">{err.name.message}</p>}
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="gender">{t("gender")}</Label>
                <select
                  id="gender"
                  className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  {...form.register("gender")}
                >
                  <option value="">{"-"}</option>
                  <option value="male">{t("genderMale")}</option>
                  <option value="female">{t("genderFemale")}</option>
                  <option value="other">{t("genderOther")}</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob">{t("dob")}</Label>
                <Input id="dob" type="date" max={new Date().toISOString().slice(0, 10)} {...form.register("date_of_birth")} />
                {err.date_of_birth && <p className="text-sm text-destructive">{err.date_of_birth.message}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">{t("address")}</Label>
              <Textarea id="address" rows={2} autoComplete="street-address" {...form.register("address")} />
              {err.address && <p className="text-sm text-destructive">{err.address.message}</p>}
            </div>
            {err.root && <p className="text-sm text-destructive">{err.root.message}</p>}
            <Button type="submit" className="h-11 px-6 text-base" disabled={update.isPending}>
              {t("save")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
