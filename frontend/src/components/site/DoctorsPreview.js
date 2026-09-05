"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const initials = (name) => name.replace(/^Dr\.?\s*/i, "").split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
const money = (v) => `৳${Number(v).toLocaleString("en-BD", { maximumFractionDigits: 0 })}`;

/** First six doctors from the public API, online ones first. */
export default function DoctorsPreview() {
  const [doctors, setDoctors] = useState(null);
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/doctors`).then((r) => r.json()).then((d) => setDoctors((d.doctors || []).sort((a, b) => Number(b.is_online) - Number(a.is_online)).slice(0, 6))).catch(() => setDoctors([]));
  }, []);
  if (doctors === null) return <div className="mt-8 grid gap-4 md:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="h-36 animate-pulse rounded-card bg-mist" />)}</div>;
  if (!doctors.length) return <p className="mt-8 text-slate">No doctors are listed yet.</p>;
  return (
    <ul className="mt-8 grid gap-4 md:grid-cols-3">
      {doctors.map((d) => (
        <li key={d.id} className="flex gap-4 rounded-card border border-rule bg-paper p-5">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-teal-50 text-lg font-bold text-teal-700">{initials(d.name)}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-bold text-ink">{"Dr. " + d.name.replace(/^(Dr\.?\s*)+/i, "")}</p>
            <p className="text-slate">{d.specialization} · {d.experience_years} years</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="font-semibold text-ink">{money(d.fee_per_consultation)}</span>
              <span className={`inline-flex items-center gap-1.5 text-sm ${d.is_online ? "text-teal-600" : "text-slate-2"}`}>
                <span className={`h-2 w-2 rounded-full ${d.is_online ? "bg-teal-500" : "bg-slate-2"}`} />{d.is_online ? "Online now" : "Offline"}
              </span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
