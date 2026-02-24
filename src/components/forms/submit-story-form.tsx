"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Panel } from "@/components/ui/panel";
import { apiRequest } from "@/lib/api";

interface MePayload {
  user: {
    id: string;
    email?: string;
  } | null;
  profile?: {
    xUsername: string | null;
  };
}

const disclaimer =
  process.env.NEXT_PUBLIC_SITE_DISCLAIMER ??
  "Proof should preferably be a reply/comment under admin tweet. Non-compliant proof may be rejected.";

export function SubmitStoryForm() {
  const [me, setMe] = useState<MePayload | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);

  const [xUsername, setXUsername] = useState("");
  const [storyText, setStoryText] = useState("");
  const [walletSolana, setWalletSolana] = useState("");
  const [country, setCountry] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadMe() {
      try {
        const payload = await apiRequest<MePayload>("/api/auth/me", {
          cache: "no-store",
        });
        if (active) {
          setMe(payload);
          if (payload.profile?.xUsername) {
            setXUsername(payload.profile.xUsername);
          }
        }
      } catch {
        if (active) {
          setMe({ user: null });
        }
      } finally {
        if (active) {
          setLoadingMe(false);
        }
      }
    }

    void loadMe();
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await apiRequest<{ xUsername: string }>("/api/profile/x-username", {
        method: "POST",
        body: JSON.stringify({ xUsername }),
      });

      await apiRequest<{ story: { id: string } }>("/api/stories", {
        method: "POST",
        body: JSON.stringify({ storyText, walletSolana, country }),
      });

      setSuccess("Story submitted. You can track status in My Submissions.");
      setStoryText("");
      setWalletSolana("");
      setCountry("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to submit story.");
    } finally {
      setLoading(false);
    }
  }

  if (loadingMe) {
    return <Panel>Loading account...</Panel>;
  }

  if (!me?.user) {
    return (
      <Panel>
        <h1 className="font-heading text-2xl">Login required</h1>
        <p className="mt-2 text-sm text-slate-300">You must sign in before posting stories.</p>
        <div className="mt-4 flex gap-2">
          <Link
            href="/auth/login"
            className="rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white"
          >
            Go to Login
          </Link>
          <Link
            href="/auth/register"
            className="rounded-xl border border-white/20 px-4 py-2 text-sm text-slate-100"
          >
            Create Account
          </Link>
        </div>
      </Panel>
    );
  }

  return (
    <div className="page-enter space-y-4">
      <Panel>
        <h1 className="font-heading text-3xl">Submit Story</h1>
        <p className="mt-2 text-sm text-slate-300">
          One submission per UTC day. Story text is immutable after posting.
        </p>
      </Panel>

      <Panel className="border-violet-300/30 bg-violet-500/10">
        <p className="text-sm text-violet-100">
          <strong>Proof Disclaimer:</strong> {disclaimer}
        </p>
      </Panel>

      <Panel>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-[0.14em] text-slate-300">X Username</span>
            <input
              value={xUsername}
              onChange={(event) => setXUsername(event.target.value)}
              placeholder="@yourhandle"
              required
              className="w-full rounded-xl border border-white/15 bg-[#0f1426] px-3 py-2 text-sm text-white outline-none focus:border-violet-400/70"
            />
            <span className="mt-1 block text-xs text-slate-400">
              This is locked after first successful set.
            </span>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-[0.14em] text-slate-300">Story</span>
            <textarea
              value={storyText}
              onChange={(event) => setStoryText(event.target.value)}
              minLength={50}
              maxLength={5000}
              rows={7}
              required
              className="w-full rounded-xl border border-white/15 bg-[#0f1426] px-3 py-2 text-sm text-white outline-none focus:border-violet-400/70"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs uppercase tracking-[0.14em] text-slate-300">Solana Wallet</span>
              <input
                value={walletSolana}
                onChange={(event) => setWalletSolana(event.target.value)}
                required
                className="w-full rounded-xl border border-white/15 bg-[#0f1426] px-3 py-2 text-sm text-white outline-none focus:border-violet-400/70"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs uppercase tracking-[0.14em] text-slate-300">Country</span>
              <input
                value={country}
                onChange={(event) => setCountry(event.target.value)}
                required
                className="w-full rounded-xl border border-white/15 bg-[#0f1426] px-3 py-2 text-sm text-white outline-none focus:border-violet-400/70"
              />
            </label>
          </div>

          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
          {success ? <p className="text-sm text-emerald-300">{success}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Submitting..." : "Submit Story"}
          </button>
        </form>
      </Panel>
    </div>
  );
}
