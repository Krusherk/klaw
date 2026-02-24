"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiRequest } from "@/lib/api";
import type { StoryOwner } from "@/lib/types";
import { formatDate, statusLabel } from "@/lib/utils";

interface MineResponse {
  stories: StoryOwner[];
}

const disclaimer =
  process.env.NEXT_PUBLIC_SITE_DISCLAIMER ??
  "Proof should preferably be a reply/comment under admin tweet. Non-compliant proof may be rejected.";

export function MySubmissionsView() {
  const [stories, setStories] = useState<StoryOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [proofByStoryId, setProofByStoryId] = useState<Record<string, string>>({});
  const [savingStoryId, setSavingStoryId] = useState<string | null>(null);

  async function loadStories() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<MineResponse>("/api/stories/mine", { cache: "no-store" });
      setStories(data.stories);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load submissions.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadStories();
  }, []);

  async function submitProof(storyId: string) {
    setSavingStoryId(storyId);
    setError(null);
    try {
      await apiRequest<{ story: StoryOwner }>(`/api/stories/${storyId}/proof`, {
        method: "POST",
        body: JSON.stringify({ proofUrl: proofByStoryId[storyId] ?? "" }),
      });
      setProofByStoryId((current) => ({ ...current, [storyId]: "" }));
      await loadStories();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to submit proof.");
    } finally {
      setSavingStoryId(null);
    }
  }

  return (
    <div className="page-enter space-y-4">
      <Panel>
        <h1 className="font-heading text-3xl">My Submissions</h1>
        <p className="mt-2 text-sm text-slate-300">
          Track your status changes, task instructions, and proof submissions.
        </p>
      </Panel>

      <Panel className="border-violet-300/30 bg-violet-500/10">
        <p className="text-sm text-violet-100">
          <strong>Proof Disclaimer:</strong> {disclaimer}
        </p>
      </Panel>

      {loading ? <Panel>Loading your submissions...</Panel> : null}
      {error ? <Panel className="border-rose-400/40 text-rose-200">{error}</Panel> : null}

      {!loading && !error ? (
        stories.length === 0 ? (
          <Panel>
            You do not have submissions yet. <Link href="/submit" className="text-violet-300">Create one now.</Link>
          </Panel>
        ) : (
          <div className="space-y-3">
            {stories.map((story) => (
              <Panel key={story.id} className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-violet-200">@{story.xUsername}</div>
                  <StatusBadge status={story.status} />
                </div>

                <p className="text-sm leading-relaxed text-slate-200">{story.storyText}</p>

                {story.task ? (
                  <div className="rounded-xl border border-white/12 bg-white/[0.03] p-3">
                    <p className="text-sm text-slate-100">
                      <strong>Task:</strong> {story.task.taskText}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">Task state: {statusLabel(story.task.state)}</p>

                    {story.task.proofUrl ? (
                      <p className="mt-2 text-xs text-slate-200">
                        Proof:{" "}
                        <a
                          className="text-violet-300 underline"
                          href={story.task.proofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {story.task.proofUrl}
                        </a>
                      </p>
                    ) : null}

                    {story.status === "pending" ? (
                      <div className="mt-3 flex flex-col gap-2 md:flex-row">
                        <input
                          value={proofByStoryId[story.id] ?? ""}
                          onChange={(event) =>
                            setProofByStoryId((current) => ({
                              ...current,
                              [story.id]: event.target.value,
                            }))
                          }
                          placeholder="Paste your X status proof URL"
                          className="w-full rounded-lg border border-white/15 bg-[#0f1426] px-3 py-2 text-sm text-white outline-none focus:border-violet-400/70"
                        />
                        <button
                          type="button"
                          disabled={savingStoryId === story.id}
                          onClick={() => void submitProof(story.id)}
                          className="rounded-lg bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                        >
                          {savingStoryId === story.id ? "Submitting..." : "Submit Proof"}
                        </button>
                      </div>
                    ) : null}

                    {story.task.decisionNote ? (
                      <p className="mt-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-200">
                        <strong>Decision note:</strong> {story.task.decisionNote}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">No task assigned yet.</p>
                )}

                <p className="text-xs text-slate-400">Submitted {formatDate(story.submittedAt)}</p>
              </Panel>
            ))}
          </div>
        )
      ) : null}
    </div>
  );
}
