"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiRequest } from "@/lib/api";
import type { StoryAdmin } from "@/lib/types";
import { formatDate, statusLabel } from "@/lib/utils";

interface AdminStoryDetailProps {
  storyId: string;
}

export function AdminStoryDetail({ storyId }: AdminStoryDetailProps) {
  const [story, setStory] = useState<StoryAdmin | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [taskText, setTaskText] = useState("");
  const [decisionNote, setDecisionNote] = useState("");
  const [busy, setBusy] = useState(false);

  const loadStory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await apiRequest<{ story: StoryAdmin }>(`/api/admin/stories/${storyId}`, {
        cache: "no-store",
      });
      setStory(payload.story);
      setTaskText(payload.story.task?.taskText ?? "");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load story.");
    } finally {
      setLoading(false);
    }
  }, [storyId]);

  useEffect(() => {
    void loadStory();
  }, [loadStory]);

  async function runAction(endpoint: string, payload?: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      await apiRequest<{ story: StoryAdmin }>(endpoint, {
        method: "POST",
        body: JSON.stringify(payload ?? {}),
      });
      await loadStory();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <Panel>Loading story details...</Panel>;
  }

  if (error) {
    return <Panel className="border-rose-400/40 text-rose-200">{error}</Panel>;
  }

  if (!story) {
    return <Panel>Story not found.</Panel>;
  }

  return (
    <div className="page-enter space-y-4">
      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-heading text-3xl">Story Details</h1>
            <p className="mt-1 text-sm text-slate-300">@{story.xUsername}</p>
          </div>
          <StatusBadge status={story.status} />
        </div>
        <p className="mt-3 text-sm text-slate-200">{story.storyText}</p>
        <p className="mt-3 text-xs text-slate-400">Submitted {formatDate(story.submittedAt)}</p>
      </Panel>

      <Panel className="space-y-2 text-sm">
        <p>
          <strong>Wallet:</strong> <span className="break-all">{story.walletSolana}</span>
        </p>
        <p>
          <strong>Country:</strong> {story.country}
        </p>
        <p>
          <strong>Task state:</strong> {story.task ? statusLabel(story.task.state) : "No task assigned"}
        </p>
        {story.task?.proofUrl ? (
          <p>
            <strong>Proof:</strong>{" "}
            <a
              href={story.task.proofUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-violet-300 underline"
            >
              {story.task.proofUrl}
            </a>
          </p>
        ) : null}
      </Panel>

      <Panel className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-xs uppercase tracking-[0.14em] text-slate-300">Task Text</label>
          <textarea
            value={taskText}
            onChange={(event) => setTaskText(event.target.value)}
            rows={4}
            className="w-full rounded-lg border border-white/15 bg-[#0f1426] px-3 py-2 text-sm text-white outline-none"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void runAction(`/api/admin/stories/${story.id}/assign-task`, {
                taskText,
              })
            }
            className="rounded-lg border border-violet-300/50 bg-violet-500/15 px-4 py-2 text-sm text-violet-100"
          >
            Assign Task
          </button>
        </div>

        <div className="space-y-2">
          <label className="block text-xs uppercase tracking-[0.14em] text-slate-300">Decision Note</label>
          <textarea
            value={decisionNote}
            onChange={(event) => setDecisionNote(event.target.value)}
            rows={4}
            className="w-full rounded-lg border border-white/15 bg-[#0f1426] px-3 py-2 text-sm text-white outline-none"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void runAction(`/api/admin/stories/${story.id}/approve`, {
                  decisionNote,
                })
              }
              className="rounded-lg border border-emerald-300/50 bg-emerald-500/15 px-3 py-2 text-xs text-emerald-100"
            >
              Approve
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void runAction(`/api/admin/stories/${story.id}/reject`, {
                  decisionNote,
                })
              }
              className="rounded-lg border border-rose-300/50 bg-rose-500/15 px-3 py-2 text-xs text-rose-100"
            >
              Reject
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void runAction(`/api/admin/stories/${story.id}/reopen`)}
              className="rounded-lg border border-amber-300/50 bg-amber-500/15 px-3 py-2 text-xs text-amber-100"
            >
              Reopen
            </button>
          </div>
        </div>
      </Panel>

      <Link href="/admin" className="inline-block text-sm text-violet-300 underline">
        Back to moderation queue
      </Link>
    </div>
  );
}
