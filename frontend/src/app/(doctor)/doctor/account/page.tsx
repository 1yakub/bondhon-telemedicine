"use client";

import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { PageTitle } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toApiError } from "@/lib/api";
import { useChangePassword, useUpdateDoctorProfile, useUser } from "@/lib/queries";

const profileSchema = z.object({
  name: z.string().trim().min(2).max(255),
  specialization: z.string().trim().min(2).max(255),
  qualifications: z.string().trim().max(2000).optional(),
  experience_years: z.number().int().min(0).max(50),
  fee_per_consultation: z.number().min(0).max(10000),
});
type Profile = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    current_password: z.string().min(1, "Enter your current password."),
    new_password: z.string().min(8, "Use at least 8 characters."),
    new_password_confirmation: z.string(),
  })
  .refine((v) => v.new_password === v.new_password_confirmation, { path: ["new_password_confirmation"], message: "The passwords do not match." });
type Password = z.infer<typeof passwordSchema>;

export default function DoctorAccountPage() {
  const t = useTranslations("doctor");
  const { data: user } = useUser();
  const update = useUpdateDoctorProfile();
  const change = useChangePassword();

  const profile = useForm<Profile>({
    resolver: zodResolver(profileSchema),
    values: {
      name: user?.name ?? "",
      specialization: user?.doctor?.specialization ?? "",
      qualifications: user?.doctor?.qualifications ?? "",
      experience_years: user?.doctor?.experience_years ?? 0,
      fee_per_consultation: Number(user?.doctor?.fee_per_consultation ?? 0),
    },
  });

  const password = useForm<Password>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { current_password: "", new_password: "", new_password_confirmation: "" },
  });

  const saveProfile = profile.handleSubmit(async (v) => {
    try {
      await update.mutateAsync(v);
      toast.success("Profile saved.");
    } catch (err) {
      toast.error(toApiError(err).message);
    }
  });

  const savePassword = password.handleSubmit(async (v) => {
    try {
      await change.mutateAsync(v);
      toast.success(t("passwordChanged"));
      password.reset();
    } catch (err) {
      password.setError("current_password", { message: toApiError(err).message });
    }
  });

  const pe = profile.formState.errors;
  const we = password.formState.errors;

  return (
    <>
      <PageTitle title={t("account")} subtitle={user?.email ?? undefined} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("account")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveProfile} className="space-y-4">
              <Field label="Name" error={pe.name?.message}>
                <Input {...profile.register("name")} />
              </Field>
              <Field label={t("specialization")} error={pe.specialization?.message}>
                <Input {...profile.register("specialization")} />
              </Field>
              <Field label={t("qualifications")} error={pe.qualifications?.message}>
                <Textarea rows={3} {...profile.register("qualifications")} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("experience")} error={pe.experience_years?.message}>
                  <Input type="number" min={0} max={50} {...profile.register("experience_years", { valueAsNumber: true })} />
                </Field>
                <Field label={t("fee")} error={pe.fee_per_consultation?.message}>
                  <Input type="number" min={0} max={10000} step={50} {...profile.register("fee_per_consultation", { valueAsNumber: true })} />
                </Field>
              </div>
              <Button type="submit" disabled={update.isPending}>
                Save
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("password")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={savePassword} className="space-y-4">
              <Field label={t("currentPassword")} error={we.current_password?.message}>
                <Input type="password" autoComplete="current-password" {...password.register("current_password")} />
              </Field>
              <Field label={t("newPassword")} error={we.new_password?.message}>
                <Input type="password" autoComplete="new-password" {...password.register("new_password")} />
              </Field>
              <Field label={t("confirmPassword")} error={we.new_password_confirmation?.message}>
                <Input type="password" autoComplete="new-password" {...password.register("new_password_confirmation")} />
              </Field>
              <Button type="submit" variant="outline" disabled={change.isPending}>
                {t("password")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
