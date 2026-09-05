import Link from "next/link";

/**
 * The Bondhon mark: two rounded links joined, one teal and one saffron. Bondhon means bond.
 * The wordmark carries both scripts, Latin first on the site, Bangla beside it.
 */
export function Mark({ className = "h-8 w-8" }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <path d="M13 11h6a9 9 0 0 1 0 18h-6a9 9 0 0 1 0-18Z" fill="none" stroke="#0e7c6b" strokeWidth="5" strokeLinejoin="round" />
      <path d="M21 11h6a9 9 0 0 1 0 18h-6" fill="none" stroke="#e9a23b" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Logo({ href = "/", size = "md", className = "" }) {
  const word = size === "lg" ? "text-2xl" : "text-xl";
  return (
    <Link href={href} className={`inline-flex items-center gap-2.5 ${className}`} aria-label="Bondhon home">
      <Mark className={size === "lg" ? "h-10 w-10" : "h-8 w-8"} />
      <span className={`${word} font-bold tracking-tight text-ink`}>
        Bondhon <span lang="bn" className="font-semibold text-teal-600">বন্ধন</span>
      </span>
    </Link>
  );
}
