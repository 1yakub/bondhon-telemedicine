import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { Providers } from "@/components/providers";
import { BANGLA_NAME } from "@/components/brand/logo";
import "./globals.css";

// every page renders per request so the CSP nonce reaches the script tags (Next CSP guide)
export const dynamic = "force-dynamic";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: { default: `Bondhon | ${BANGLA_NAME}`, template: "%s | Bondhon" },
  description:
    "Talk to a doctor on video from your phone. Sign in with your mobile number, pick a doctor, pay, and start the call. Bangladesh.",
  metadataBase: new URL(siteUrl),
  openGraph: { title: `Bondhon | ${BANGLA_NAME}`, description: "A doctor on video, from your phone.", type: "website" },
};

export const viewport: Viewport = { themeColor: "#ffffff", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();

  return (
    <html lang={locale} className="h-full antialiased">
      <body className="flex min-h-full flex-col font-sans">
        <NextIntlClientProvider>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
