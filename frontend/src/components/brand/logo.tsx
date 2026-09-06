import Link from "next/link";
import { cn } from "@/lib/utils";

/** The Bondhon wordmark in Bangla script, written as escapes so the source stays ASCII. */
export const BANGLA_NAME = "\u09AC\u09A8\u09CD\u09A7\u09A8";

/** Two rounded links joined, one teal and one saffron. Bondhon means bond. */
export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("size-8", className)} aria-hidden="true">
      <path d="M13 11h6a9 9 0 0 1 0 18h-6a9 9 0 0 1 0-18Z" fill="none" stroke="var(--color-teal-500)" strokeWidth="5" strokeLinejoin="round" />
      <path d="M21 11h6a9 9 0 0 1 0 18h-6" fill="none" stroke="var(--color-saffron-500)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ href = "/", size = "md", className }: { href?: string; size?: "md" | "lg"; className?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5", className)} aria-label="Bondhon home">
      <Mark className={size === "lg" ? "size-10" : "size-8"} />
      <span className={cn("font-bold tracking-tight text-foreground", size === "lg" ? "text-2xl" : "text-xl")}>
        Bondhon{" "}
        <span lang="bn" className="font-semibold text-primary">
          {BANGLA_NAME}
        </span>
      </span>
    </Link>
  );
}
