"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

interface MePayload {
  user: {
    id: string;
    email?: string;
    isAdmin?: boolean;
    adminDisplayName?: string | null;
  } | null;
  profile?: {
    xUsername: string | null;
  };
}

const navItems = [
  { href: "/", label: "Home" },
  { href: "/stories", label: "Stories" },
  { href: "/submit", label: "Submit" },
  { href: "/my-submissions", label: "My Submissions" },
  { href: "/admin", label: "Admin" },
];

export function SiteNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<MePayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        const payload = (await response.json()) as MePayload;
        if (active) {
          setMe(payload);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, []);

  const xUsername = useMemo(() => me?.profile?.xUsername, [me?.profile?.xUsername]);
  const isAdmin = Boolean(me?.user?.isAdmin);
  const adminName = me?.user?.adminDisplayName ?? "Lobstar";

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.refresh();
    window.location.href = "/auth/login";
  }

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[rgba(11,10,10,0.84)] backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center justify-between">
          <Link href="/" className="font-heading text-xl tracking-tight text-white">
            Klaw Field
          </Link>
          <div className="text-[11px] uppercase tracking-[0.18em] text-rose-300/70 md:hidden">
            Moderation Network
          </div>
        </div>

        <nav className="flex flex-wrap items-center gap-2">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "border-rose-400/80 bg-rose-500/20 text-white"
                    : "border-white/15 bg-white/[0.04] text-slate-200 hover:border-rose-300/50 hover:text-white",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center justify-end gap-2 text-sm text-slate-200">
          {loading ? (
            <span className="text-slate-400">Loading session...</span>
          ) : me?.user ? (
            <>
              <span className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-1 text-xs">
                {isAdmin ? `${adminName} (Admin)` : xUsername ? `@${xUsername}` : me.user.email}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-white/20 px-3 py-1 text-xs text-slate-200 transition hover:border-rose-300/60 hover:text-white"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="rounded-lg border border-white/20 px-3 py-1 text-xs hover:border-rose-300/60"
              >
                Login
              </Link>
              <Link
                href="/auth/register"
                className="rounded-lg bg-gradient-to-r from-red-600 to-rose-700 px-3 py-1 text-xs font-semibold text-white"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
