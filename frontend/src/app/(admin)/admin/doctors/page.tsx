"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { PageTitle } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OnlineDot } from "@/components/status-badge";
import { toApiError } from "@/lib/api";
import { money } from "@/lib/format";
import { useAdminDoctorMutations, useAdminDoctors } from "@/lib/queries";
import type { AdminDoctor } from "@/lib/types";

const makeCreateSchema = (tv: (key: string) => string) =>
  z.object({
  name: z.string().trim().min(2).max(255),
  email: z.email(),
  password: z.string().min(8, tv("minPassword")),
  phone: z.string().trim().optional(),
  specialization: z.string().trim().min(2).max(255),
  qualifications: z.string().trim().optional(),
  experience_years: z.number().int().min(0).max(50),
  fee_per_consultation: z.number().min(0).max(10000),
  });
type CreateValues = z.infer<ReturnType<typeof makeCreateSchema>>;

export default function AdminDoctorsPage() {
  const t = useTranslations("admin");
  const td = useTranslations("doctors");
  const { data, isPending } = useAdminDoctors();
  const { toggle } = useAdminDoctorMutations();

  return (
    <>
      <PageTitle title={t("doctors")} action={<CreateDoctorDialog />} />
      {isPending ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.name")}</TableHead>
                <TableHead>{t("table.specialization")}</TableHead>
                <TableHead>{t("table.email")}</TableHead>
                <TableHead className="text-right">{t("table.fee")}</TableHead>
                <TableHead>{t("table.status")}</TableHead>
                <TableHead className="text-right">{t("table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data ?? []).map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.name}</TableCell>
                  <TableCell>{d.specialization ?? "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{d.email}</TableCell>
                  <TableCell className="text-right">{money(d.fee_per_consultation)}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-2">
                      <OnlineDot online={d.is_online} />
                      {d.is_online ? td("online") : td("offline")}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" disabled={toggle.isPending} onClick={() => toggle.mutate(d.id, { onError: (e) => toast.error(toApiError(e).message) })}>
                        {d.is_online ? t("setOffline") : t("setOnline")}
                      </Button>
                      <ResetPasswordDialog doctor={d} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}

function CreateDoctorDialog() {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const tv = useTranslations("validation");
  const createSchema = useMemo(() => makeCreateSchema(tv), [tv]);
  const { create } = useAdminDoctorMutations();
  const [open, setOpen] = useState(false);
  const form = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: "", email: "", password: "", phone: "", specialization: "", qualifications: "", experience_years: 0, fee_per_consultation: 500 },
  });
  const err = form.formState.errors;

  const submit = form.handleSubmit(async (v) => {
    try {
      await create.mutateAsync({ ...v, phone: v.phone || null, qualifications: v.qualifications || null });
      toast.success(t("created"));
      form.reset();
      setOpen(false);
    } catch (e) {
      const a = toApiError(e);
      for (const [field, messages] of Object.entries(a.errors)) form.setError(field as keyof CreateValues, { message: messages[0] });
      if (!Object.keys(a.errors).length) form.setError("root", { message: a.message });
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus data-icon="inline-start" />
        {t("addDoctor")}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t("addDoctor")}</DialogTitle>
            <DialogDescription>{t("addDoctorBody")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <F label={t("table.name")} error={err.name?.message}><Input {...form.register("name")} /></F>
            <F label={t("table.specialization")} error={err.specialization?.message}><Input {...form.register("specialization")} /></F>
            <F label={t("table.email")} error={err.email?.message}><Input type="email" autoComplete="off" {...form.register("email")} /></F>
            <F label={tc("password")} error={err.password?.message}><Input type="password" autoComplete="new-password" {...form.register("password")} /></F>
            <F label={t("table.phone")} error={err.phone?.message}><Input {...form.register("phone")} /></F>
            <F label={tc("qualifications")} error={err.qualifications?.message}><Input {...form.register("qualifications")} /></F>
            <F label={tc("yearsOfExperience")} error={err.experience_years?.message}><Input type="number" min={0} max={50} {...form.register("experience_years", { valueAsNumber: true })} /></F>
            <F label={tc("feeBdt")} error={err.fee_per_consultation?.message}><Input type="number" min={0} max={10000} step={50} {...form.register("fee_per_consultation", { valueAsNumber: true })} /></F>
          </div>
          {err.root && <p className="text-sm text-destructive">{err.root.message}</p>}
          <DialogFooter>
            <Button type="submit" disabled={create.isPending}>
              {t("create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordDialog({ doctor }: { doctor: AdminDoctor }) {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const tv = useTranslations("validation");
  const { resetPassword } = useAdminDoctorMutations();
  const [open, setOpen] = useState(false);
  const form = useForm<{ new_password: string }>({
    resolver: zodResolver(z.object({ new_password: z.string().min(8, tv("minPassword")) })),
    defaultValues: { new_password: "" },
  });

  const submit = form.handleSubmit(async (v) => {
    try {
      await resetPassword.mutateAsync({ id: doctor.id, new_password: v.new_password });
      toast.success(t("resetDone"));
      form.reset();
      setOpen(false);
    } catch (e) {
      form.setError("new_password", { message: toApiError(e).message });
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="ghost" />}>{t("resetPassword")}</DialogTrigger>
      <DialogContent>
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t("resetPassword")}</DialogTitle>
            <DialogDescription>{t("resetPasswordBody", { name: doctor.name })}</DialogDescription>
          </DialogHeader>
          <F label={tc("newPassword")} error={form.formState.errors.new_password?.message}>
            <Input type="password" autoComplete="new-password" {...form.register("new_password")} />
          </F>
          <DialogFooter>
            <Button type="submit" disabled={resetPassword.isPending}>
              {t("reset")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function F({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
