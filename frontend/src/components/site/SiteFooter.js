import Link from "next/link";
import Logo from "../brand/Logo";

export default function SiteFooter() {
  return (
    <footer className="border-t border-rule bg-mist">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-3">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-slate">A doctor on video, from your phone. Sign in with your number, pick a doctor, pay, and talk.</p>
          <p lang="bn" className="mt-2 max-w-xs text-slate">আপনার ফোন থেকেই ভিডিওতে ডাক্তার দেখান।</p>
        </div>
        <div className="text-slate">
          <p className="font-semibold text-ink">Pages</p>
          <ul className="mt-2 space-y-1.5">
            <li><Link href="/doctors" className="hover:text-teal-600">Doctors</Link></li>
            <li><Link href="/login" className="hover:text-teal-600">Patient sign in</Link></li>
            <li><Link href="/doctor/login" className="hover:text-teal-600">Doctor sign in</Link></li>
            <li><Link href="/admin/login" className="hover:text-teal-600">Admin</Link></li>
          </ul>
        </div>
        <div className="text-slate">
          <p className="font-semibold text-ink">About this demo</p>
          <p className="mt-2">Bondhon is a telemedicine platform built in Bangladesh. This is a working demo: video calls run on Agora, payments are in test mode, and the data resets every night.</p>
          {process.env.NEXT_PUBLIC_DEMO === "true" && (
            <p className="mt-3 rounded-control bg-paper p-3 text-sm">
              Try it: sign in as a patient with any Bangladeshi mobile number, the code appears on screen. Doctor: <span className="font-semibold text-ink">ahmed@bondhon.com</span>, Admin: <span className="font-semibold text-ink">admin@bondhon.com</span>, password for both is shown on their sign in pages.
            </p>
          )}
        </div>
      </div>
      <div className="border-t border-rule">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-5 text-sm text-slate sm:flex-row sm:items-center sm:justify-between">
          <p>Bondhon is not for emergencies. If someone is in danger, call 999.</p>
          <a href="https://github.com/1yakub/bondhon-telemedicine" className="hover:text-teal-600">Source on GitHub</a>
        </div>
      </div>
    </footer>
  );
}
