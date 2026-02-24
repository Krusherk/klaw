import type { Metadata } from "next";
import { JetBrains_Mono, Manrope, Sora } from "next/font/google";

import { SiteNav } from "@/components/ui/site-nav";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Klaw Field",
  description: "Stories, task moderation, and proof review workflow built on Supabase.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${sora.variable} ${manrope.variable} ${jetBrainsMono.variable} antialiased`}
      >
        <div className="relative min-h-screen overflow-x-hidden">
          <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_14%_8%,rgba(220,38,38,0.24),transparent_34%),radial-gradient(circle_at_88%_0%,rgba(127,29,29,0.22),transparent_40%),radial-gradient(circle_at_50%_100%,rgba(57,24,24,0.44),transparent_48%),linear-gradient(180deg,#050505_0%,#0a0a0a_52%,#111214_100%)]" />
          <div className="pointer-events-none fixed inset-0 -z-10 bg-grid-pattern opacity-25" />
          <SiteNav />
          <main className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
