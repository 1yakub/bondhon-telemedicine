"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toApiError } from "@/lib/api";
import { useBookConsultation, useUser } from "@/lib/queries";
import type { Doctor } from "@/lib/types";

const makeSchema = (tv: (key: string) => string) =>
  z.object({
    patient_symptoms: z.string().trim().max(1000, tv("maxSymptoms")).optional(),
  });
type Values = z.infer<ReturnType<typeof makeSchema>>;

/** Signed in patients book in a dialog; everyone else is sent to sign in and back here. */
export function BookVisit({ doctor }: { doctor: Doctor }) {
  const t = useTranslations("booking");
  const td = useTranslations("doctors");
  const tv = useTranslations("validation");
  const schema = useMemo(() => makeSchema(tv), [tv]);
  const { data: user, isPending } = useUser();
  const router = useRouter();
  const book = useBookConsultation();
  const [open, setOpen] = useState(false);

  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { patient_symptoms: "" } });

  if (isPending) return <Button className="h-11 w-full text-base" disabled>{t("title")}</Button>;

  if (!user) {
    return (
      <Button className="h-11 w-full text-base" render={<Link href={`/login?next=${encodeURIComponent(`/doctors/${doctor.id}`)}`} />}>
        {t("signInFirst")}
      </Button>
    );
  }

  if (user.role !== "patient") {
    return <p className="text-sm text-muted-foreground">{td("onlyPatientsBook")}</p>;
  }

  const submit = form.handleSubmit(async (values) => {
    try {
      const visit = await book.mutateAsync({ doctor_id: doctor.id, patient_symptoms: values.patient_symptoms || undefined });
      toast.success(t("created"));
      setOpen(false);
      router.push(`/visits/${visit.id}`);
    } catch (err) {
      const e = toApiError(err);
      if (e.errors.doctor_id) form.setError("root", { message: e.errors.doctor_id[0] });
      else form.setError("root", { message: e.message });
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="h-11 w-full text-base" />}>{t("title")}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="symptoms">{t("symptoms")}</Label>
            <Textarea id="symptoms" rows={4} placeholder={t("symptomsPlaceholder")} {...form.register("patient_symptoms")} />
            {form.formState.errors.patient_symptoms && (
              <p className="text-sm text-destructive">{form.formState.errors.patient_symptoms.message}</p>
            )}
          </div>
          {form.formState.errors.root && <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>}
          <DialogFooter>
            <Button type="submit" className="w-full" disabled={book.isPending}>
              {t("confirm")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
