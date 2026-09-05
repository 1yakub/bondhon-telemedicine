"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

const valid = (p) => /^01[3-9]\d{8}$/.test(p);

/** The hero form: a phone number, one button. It hands the number to the sign in page. */
export default function PhoneStart() {
  const [phone, setPhone] = useState("");
  const router = useRouter();
  const submit = (e) => {
    e.preventDefault();
    if (valid(phone)) router.push(`/login?phone=${phone}`);
  };
  return (
    <form onSubmit={submit} className="mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
      <label className="sr-only" htmlFor="start-phone">Mobile number</label>
      <div className="flex flex-1 items-center rounded-control border border-rule bg-paper focus-within:border-teal-600">
        <span className="pl-4 text-slate">+88</span>
        <input id="start-phone" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="01XXXXXXXXX" value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
          className="tap w-full bg-transparent px-2 text-lg text-ink placeholder:text-slate-2 focus:outline-none" />
      </div>
      <button type="submit" disabled={!valid(phone)} className="tap inline-flex items-center justify-center gap-2 rounded-control bg-teal-600 px-6 text-lg font-semibold text-white hover:bg-teal-700 disabled:opacity-40">
        Start <span lang="bn">শুরু করুন</span> <ArrowRight className="h-5 w-5" />
      </button>
    </form>
  );
}
