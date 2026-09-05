import "./globals.css";

export const metadata = {
  title: "Bondhon | বন্ধন",
  description:
    "Talk to a doctor on video from your phone. Sign in with your mobile number, pick a doctor, pay, and start the call. Bangladesh.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  openGraph: {
    title: "Bondhon | বন্ধন",
    description: "A doctor on video, from your phone.",
    type: "website",
  },
};

export const viewport = { themeColor: "#ffffff", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
