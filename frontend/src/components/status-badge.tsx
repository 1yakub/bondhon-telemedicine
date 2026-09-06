import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ConsultationStatus } from "@/lib/types";

const tone: Record<ConsultationStatus, string> = {
  pending: "bg-saffron-100 text-saffron-600 border-transparent",
  confirmed: "bg-accent text-accent-foreground border-transparent",
  in_progress: "bg-primary text-primary-foreground border-transparent",
  completed: "bg-muted text-muted-foreground border-transparent",
  cancelled: "bg-destructive/10 text-destructive border-transparent",
};

export function StatusBadge({ status, className }: { status: ConsultationStatus; className?: string }) {
  const t = useTranslations("status");
  return (
    <Badge variant="outline" className={cn(tone[status], className)}>
      {t(status)}
    </Badge>
  );
}

export function OnlineDot({ online, className }: { online: boolean; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block size-2.5 rounded-full", online ? "bg-ok" : "bg-muted-foreground/40", className)}
    />
  );
}
