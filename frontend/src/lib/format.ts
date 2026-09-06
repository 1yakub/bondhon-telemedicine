const bdt = new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
const dateTime = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const dateOnly = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const monthName = new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric" });

export const money = (value: string | number | null | undefined) => bdt.format(Number(value ?? 0));
export const when = (iso: string | null | undefined) => (iso ? dateTime.format(new Date(iso)) : "");
export const day = (iso: string | null | undefined) => (iso ? dateOnly.format(new Date(iso)) : "");
export const month = (ym: string) => monthName.format(new Date(`${ym}-01T00:00:00`));

export const initials = (name: string | null | undefined) =>
  (name ?? "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "?";
