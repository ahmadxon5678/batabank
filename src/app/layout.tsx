import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getLocale } from "@/lib/i18n";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BataBank",
  description: "Ishlatilgan batareyalarni xavfsiz yig'ish platformasi",
  icons: {
    icon: "/assets/batabank-logo-transparent.png",
    apple: "/assets/batabank-logo-transparent.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full bg-[#f5f8f2] text-slate-950"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
