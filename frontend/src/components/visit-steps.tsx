import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConsultationStatus } from "@/lib/types";

const order: ConsultationStatus[] = ["pending", "confirmed", "in_progress", "completed"];

/** The visit journey in one line: booked, paid, doctor ready, in the call, done. */
export function VisitSteps({ status }: { status: ConsultationStatus }) {
  const t = useTranslations("visits.steps");
  const steps = [t("booked"), t("paid"), t("inCall"), t("done")];
  // index of the step currently reached; "cancelled" shows as stopped after booking
  const reached = status === "cancelled" ? 0 : order.indexOf(status);

  return (
    <ol className="flex items-center gap-2" aria-label="Progress">
      {steps.map((label, i) => {
        const done = i < reached || status === "completed";
        const current = i === reached && status !== "completed";
        return (
          <li key={label} className="flex flex-1 items-center gap-2 last:flex-none">
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                done && "border-primary bg-primary text-primary-foreground",
                current && "border-primary text-primary",
                !done && !current && "border-border text-muted-foreground",
              )}
              aria-current={current ? "step" : undefined}
            >
              {done ? <Check className="size-4" aria-hidden="true" /> : i + 1}
            </span>
            <span className={cn("hidden text-sm sm:inline", current ? "font-semibold" : "text-muted-foreground")}>{label}</span>
            {i < steps.length - 1 && <span className={cn("h-px flex-1", done ? "bg-primary" : "bg-border")} aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}
