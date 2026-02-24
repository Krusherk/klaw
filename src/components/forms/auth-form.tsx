"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Panel } from "@/components/ui/panel";
import { apiRequest } from "@/lib/api";

interface AuthFormProps {
  mode: "login" | "register";
}

interface AuthResponse {
  requiresEmailVerification?: boolean;
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const payload = await apiRequest<AuthResponse>(`/api/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (mode === "register" && payload.requiresEmailVerification) {
        setMessage("Account created. Check your email verification settings in Supabase before login.");
      } else {
        router.push("/submit");
        router.refresh();
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-enter mx-auto max-w-lg">
      <Panel>
        <h1 className="font-heading text-3xl">{mode === "login" ? "Sign in" : "Create account"}</h1>
        <p className="mt-2 text-sm text-slate-300">
          Use your account to submit stories, upload proof links, and track moderation status.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-[0.14em] text-slate-300">Email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full rounded-xl border border-white/15 bg-[#141113] px-3 py-2 text-sm text-white outline-none focus:border-rose-400/70"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-[0.14em] text-slate-300">Password</span>
            <input
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              className="w-full rounded-xl border border-white/15 bg-[#141113] px-3 py-2 text-sm text-white outline-none focus:border-rose-400/70"
            />
          </label>

          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-300">{message}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-red-600 to-rose-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Please wait..." : mode === "login" ? "Login" : "Register"}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-300">
          {mode === "login" ? "No account yet?" : "Already have an account?"}{" "}
          <Link
            href={mode === "login" ? "/auth/register" : "/auth/login"}
            className="font-semibold text-rose-300"
          >
            {mode === "login" ? "Register" : "Sign in"}
          </Link>
        </p>
      </Panel>
    </div>
  );
}
