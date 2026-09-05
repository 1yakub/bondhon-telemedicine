import Link from "next/link";
import Image from "next/image";
import { Phone, Stethoscope, Video, ShieldCheck, Clock, Wallet } from "lucide-react";
import SiteHeader from "../components/site/SiteHeader";
import SiteFooter from "../components/site/SiteFooter";
import PhoneStart from "../components/site/PhoneStart";
import DoctorsPreview from "../components/site/DoctorsPreview";

export const revalidate = 0;

export default function Home() {
  return (
    <div className="min-h-screen bg-paper">
      <SiteHeader />
      <main id="content">
        {/* Hero: one photo, one sentence in both languages, the phone number field right here */}
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-10 md:grid-cols-2 md:pt-16">
          <div>
            <h1 className="text-display font-bold tracking-tight text-ink">
              A doctor on video,<br />from your phone.
            </h1>
            <p lang="bn" className="mt-3 text-title font-semibold text-teal-600">আপনার ফোন থেকেই ভিডিওতে ডাক্তার দেখান।</p>
            <p className="measure mt-5 text-lg text-slate">
              Sign in with your mobile number. Pick a doctor who is online. Pay the fee. The call starts in your browser, no app to install.
            </p>
            <PhoneStart />
            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate">
              <li className="inline-flex items-center gap-2"><Clock className="h-4 w-4 text-teal-600" /> Usually under 10 minutes</li>
              <li className="inline-flex items-center gap-2"><Wallet className="h-4 w-4 text-teal-600" /> From ৳500 a visit</li>
              <li className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-teal-600" /> Your call is private</li>
            </ul>
          </div>
          <div className="relative overflow-hidden rounded-card bg-mist-2 shadow-lift">
            <Image src="/images/hero.jpg" alt="A woman at home on a video call with a doctor, on her phone" width={1200} height={900} priority className="h-full w-full object-cover" />
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="bg-mist">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <h2 className="text-title font-bold text-ink">Three steps to a doctor</h2>
            <p lang="bn" className="mt-1 text-lg text-teal-600">তিন ধাপে ডাক্তার</p>
            <ol className="mt-8 grid gap-6 md:grid-cols-3">
              {[
                { Icon: Phone, en: "Sign in with your number", bn: "নম্বর দিয়ে লগইন", text: "We send a six digit code by SMS. No password, no email." },
                { Icon: Stethoscope, en: "Pick a doctor who is online", bn: "অনলাইন ডাক্তার বেছে নিন", text: "See the specialty, years of experience and the fee before you choose." },
                { Icon: Video, en: "Pay and start the call", bn: "ফি দিয়ে কল শুরু করুন", text: "Pay with bKash, card or bank. The video call opens right here in your browser." },
              ].map((s, i) => (
                <li key={s.en} className="rounded-card bg-paper p-6 shadow-lift">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-full bg-teal-50 text-teal-600"><s.Icon className="h-5 w-5" /></span>
                    <span className="text-sm font-semibold text-slate">Step {i + 1}</span>
                  </div>
                  <h3 className="mt-4 text-xl font-bold text-ink">{s.en}</h3>
                  <p lang="bn" className="text-teal-600">{s.bn}</p>
                  <p className="mt-2 text-slate">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Doctors online right now, from the API */}
        <section className="mx-auto max-w-6xl px-5 py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-title font-bold text-ink">Doctors on Bondhon</h2>
              <p lang="bn" className="mt-1 text-lg text-teal-600">বন্ধনের ডাক্তাররা</p>
            </div>
            <Link href="/doctors" className="tap inline-flex items-center rounded-control border border-rule px-5 font-semibold text-ink hover:border-teal-600 hover:text-teal-600">See all doctors</Link>
          </div>
          <DoctorsPreview />
        </section>

        {/* Plain promise band */}
        <section className="bg-ink text-white">
          <div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-title font-bold">Made for the whole family</h2>
              <p lang="bn" className="mt-1 text-lg text-saffron-500">পরিবারের সবার জন্য</p>
            </div>
            <p className="text-lg text-white/80">
              Big buttons, few words, Bangla and English side by side. Someone who reads little can still reach a doctor with three taps. Children and parents can be booked from one account.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
