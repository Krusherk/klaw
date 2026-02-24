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
          <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(84,76,255,0.18),transparent_38%),radial-gradient(circle_at_78%_0%,rgba(136,99,255,0.2),transparent_40%),radial-gradient(circle_at_50%_100%,rgba(44,63,152,0.15),transparent_45%),linear-gradient(180deg,#060810_0%,#070b17_45%,#090f1d_100%)]" />
          <div className="pointer-events-none fixed inset-0 -z-10 bg-grid-pattern opacity-35" />
          <SiteNav />
          <main className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
