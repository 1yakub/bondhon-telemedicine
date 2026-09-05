"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Logo from "../../components/brand/Logo";

const isValidPhone = (p) => /^01[3-9]\d{8}$/.test(p);
const api = (path, init) =>
  fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    ...init,
  });

function PatientLogin() {
  const params = useSearchParams();
  const router = useRouter();
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [debugOtp, setDebugOtp] = useState("");

  // The home page hands the number over; skip straight to the code
  useEffect(() => {
    const p = params.get("phone");
    if (p && isValidPhone(p)) { setPhone(p); sendOtp(null, p); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const sendOtp = async (e, number = phone) => {
    e?.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await api("/auth/send-otp", { method: "POST", body: JSON.stringify({ phone: number }) });
      const data = await res.json().catch(() => ({}));
      if (res.ok) { setStep("otp"); if (data.debug_otp) setDebugOtp(String(data.debug_otp)); }
      else setError(data.message || "We could not send the code. Try again.");
    } catch { setError("No connection. Check your internet and try again."); }
    finally { setLoading(false); }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await api("/auth/verify-otp", { method: "POST", body: JSON.stringify({ phone, otp }) });
      const data = await res.json().catch(() => ({}));
      if (res.ok) router.push(data.needs_profile_completion ? "/patient/complete-profile" : "/patient/dashboard");
      else setError(data.message || "That code is not right. Check the SMS and try again.");
    } catch { setError("No connection. Check your internet and try again."); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-mist">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-8">
        <Logo />
        <div className="my-auto rounded-card bg-paper p-6 shadow-lift sm:p-8">
          {step === "phone" ? (
            <form onSubmit={sendOtp}>
              <h1 className="text-2xl font-bold text-ink">Sign in with your number</h1>
              <p lang="bn" className="mt-1 text-lg text-teal-600">আপনার মোবাইল নম্বর দিন</p>
              <p className="mt-3 text-slate">We send a six digit code by SMS. No password.</p>
              <label htmlFor="phone" className="mt-6 block font-semibold text-ink">Mobile number <span lang="bn" className="font-medium text-slate">মোবাইল নম্বর</span></label>
              <div className="mt-2 flex items-center rounded-control border border-rule focus-within:border-teal-600">
                <span className="pl-4 text-slate">+88</span>
                <input id="phone" type="tel" inputMode="numeric" autoComplete="tel-national" autoFocus placeholder="01XXXXXXXXX" value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
                  className="tap w-full bg-transparent px-2 text-xl tracking-wide text-ink placeholder:text-slate-2 focus:outline-none" />
              </div>
              {phone.length > 0 && !isValidPhone(phone) && <p className="mt-2 text-sm text-danger">Eleven digits, starting with 013 to 019.</p>}
              {error && <p role="alert" className="mt-3 rounded-control bg-saffron-100 px-4 py-3 text-ink">{error}</p>}
              <button type="submit" disabled={!isValidPhone(phone) || loading} className="tap mt-6 w-full rounded-control bg-teal-600 text-lg font-semibold text-white hover:bg-teal-700 disabled:opacity-40">
                {loading ? "Sending…" : <>Send code <span lang="bn" className="font-medium">কোড পাঠান</span></>}
              </button>
            </form>
          ) : (
            <form onSubmit={verifyOtp}>
              <button type="button" onClick={() => { setStep("phone"); setOtp(""); setError(""); setDebugOtp(""); }} className="inline-flex items-center gap-1 text-slate hover:text-teal-600">
                <ArrowLeft className="h-4 w-4" /> Change number
              </button>
              <h1 className="mt-4 text-2xl font-bold text-ink">Enter the code</h1>
              <p lang="bn" className="mt-1 text-lg text-teal-600">কোডটি লিখুন</p>
              <p className="mt-3 text-slate">We sent it by SMS to <span className="font-semibold text-ink">+88{phone}</span>.</p>
              {debugOtp && <p className="mt-3 rounded-control bg-saffron-100 px-4 py-3 text-ink">Demo mode, no SMS is sent. Your code is <strong className="tracking-widest">{debugOtp}</strong>.</p>}
              <label htmlFor="otp" className="mt-6 block font-semibold text-ink">Six digit code <span lang="bn" className="font-medium text-slate">ছয় সংখ্যার কোড</span></label>
              <input id="otp" type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6} autoComplete="one-time-code" autoFocus placeholder="••••••" value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="tap mt-2 w-full rounded-control border border-rule px-4 text-center text-3xl tracking-[0.5em] text-ink placeholder:text-slate-2 focus:border-teal-600 focus:outline-none" />
              {error && <p role="alert" className="mt-3 rounded-control bg-saffron-100 px-4 py-3 text-ink">{error}</p>}
              <button type="submit" disabled={otp.length !== 6 || loading} className="tap mt-6 w-full rounded-control bg-teal-600 text-lg font-semibold text-white hover:bg-teal-700 disabled:opacity-40">
                {loading ? "Checking…" : <>Sign in <span lang="bn" className="font-medium">লগইন</span></>}
              </button>
            </form>
          )}
        </div>
        <p className="mt-6 text-center text-slate">
          Are you a doctor? <Link href="/doctor/login" className="font-semibold text-teal-600 hover:underline">Doctor sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-mist" />}>
      <PatientLogin />
    </Suspense>
  );
}
