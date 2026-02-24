"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiRequest } from "@/lib/api";
import type { StoryAdmin, StoryStatus, StoriesPageResult } from "@/lib/types";
import { formatDate, statusLabel } from "@/lib/utils";

const statuses: Array<{ value: "all" | StoryStatus; label: string }> = [
  { value: "all", label: "All" },
  { value: "normal", label: "Normal" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export function AdminQueue() {
  const [status, setStatus] = useState<"all" | StoryStatus>("all");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const [stories, setStories] = useState<StoryAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [taskInput, setTaskInput] = useState<Record<string, string>>({});
  const [noteInput, setNoteInput] = useState<Record<string, string>>({});
  const [busyStoryId, setBusyStoryId] = useState<string | null>(null);

  const loadStories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<StoriesPageResult<StoryAdmin>>(
        `/api/admin/stories?status=${status}&q=${encodeURIComponent(appliedSearch)}&page=1&pageSize=40`,
        { cache: "no-store" },
      );
      setStories(data.stories);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load admin queue.");
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, status]);

  useEffect(() => {
    void loadStories();
  }, [loadStories]);

  async function applyAction(storyId: string, endpoint: string, payload?: Record<string, unknown>) {
    setBusyStoryId(storyId);
    setError(null);

    try {
      await apiRequest<{ story: StoryAdmin }>(endpoint, {
        method: "POST",
        body: JSON.stringify(payload ?? {}),
      });
      await loadStories();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Action failed.");
    } finally {
      setBusyStoryId(null);
    }
  }

  return (
    <div className="page-enter space-y-4">
      <Panel>
        <h1 className="font-heading text-3xl">Admin Moderation Queue</h1>
        <p className="mt-2 text-sm text-slate-300">
          Assign one active task per story, review proof links, and transition statuses.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {statuses.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setStatus(item.value)}
              className={`rounded-full border px-3 py-1.5 text-xs ${
                status === item.value
                  ? "border-violet-400/80 bg-violet-500/20 text-white"
                  : "border-white/15 bg-white/[0.03] text-slate-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <form
          className="mt-3 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setAppliedSearch(search.trim());
          }}
        >
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search X username"
            className="w-full rounded-lg border border-white/15 bg-[#0f1426] px-3 py-2 text-sm text-white outline-none"
          />
          <button
            type="submit"
            className="rounded-lg bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white"
          >
            Search
          </button>
        </form>
      </Panel>

      {loading ? <Panel>Loading moderation queue...</Panel> : null}
      {error ? <Panel className="border-rose-400/40 text-rose-200">{error}</Panel> : null}

      {!loading && !error ? (
        stories.length === 0 ? (
          <Panel>No stories found for this filter.</Panel>
        ) : (
          <div className="space-y-3">
            {stories.map((story) => (
              <Panel key={story.id} className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-violet-200">@{story.xUsername}</p>
                    <p className="text-xs text-slate-400">Submitted {formatDate(story.submittedAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={story.status} />
                    <Link
                      href={`/admin/story/${story.id}`}
                      className="rounded-lg border border-white/20 px-2 py-1 text-xs text-slate-200"
                    >
                      Details
                    </Link>
                  </div>
                </div>

                <p className="text-sm text-slate-200">{story.storyText}</p>

                <div className="grid gap-2 rounded-xl border border-white/10 bg-black/20 p-3 text-xs md:grid-cols-2">
                  <p>
                    <strong>Wallet:</strong> <span className="break-all">{story.walletSolana}</span>
                  </p>
                  <p>
                    <strong>Country:</strong> {story.country}
                  </p>
                  <p className="md:col-span-2">
                    <strong>Task state:</strong> {story.task ? statusLabel(story.task.state) : "No task yet"}
                  </p>
                  {story.task?.proofUrl ? (
                    <p className="md:col-span-2">
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
                </div>

                <div className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-xs uppercase tracking-[0.14em] text-slate-300">Task assignment</label>
                    <input
                      value={taskInput[story.id] ?? story.task?.taskText ?? ""}
                      onChange={(event) =>
                        setTaskInput((current) => ({
                          ...current,
                          [story.id]: event.target.value,
                        }))
                      }
                      placeholder="Enter task for this story"
                      className="w-full rounded-lg border border-white/15 bg-[#0f1426] px-3 py-2 text-sm text-white outline-none"
                    />
                    <button
                      type="button"
                      disabled={busyStoryId === story.id}
                      onClick={() =>
                        void applyAction(story.id, `/api/admin/stories/${story.id}/assign-task`, {
                          taskText: taskInput[story.id] ?? story.task?.taskText ?? "",
                        })
                      }
                      className="rounded-lg border border-violet-300/50 bg-violet-500/15 px-3 py-2 text-xs text-violet-100 disabled:opacity-60"
                    >
                      {busyStoryId === story.id ? "Saving..." : "Assign Task"}
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs uppercase tracking-[0.14em] text-slate-300">Decision note</label>
                    <input
                      value={noteInput[story.id] ?? ""}
                      onChange={(event) =>
                        setNoteInput((current) => ({
                          ...current,
                          [story.id]: event.target.value,
                        }))
                      }
                      placeholder="Optional note"
                      className="w-full rounded-lg border border-white/15 bg-[#0f1426] px-3 py-2 text-sm text-white outline-none"
                    />

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busyStoryId === story.id}
                        onClick={() =>
                          void applyAction(story.id, `/api/admin/stories/${story.id}/approve`, {
                            decisionNote: noteInput[story.id] ?? "",
                          })
                        }
                        className="rounded-lg border border-emerald-300/50 bg-emerald-500/15 px-3 py-2 text-xs text-emerald-100 disabled:opacity-60"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={busyStoryId === story.id}
                        onClick={() =>
                          void applyAction(story.id, `/api/admin/stories/${story.id}/reject`, {
                            decisionNote: noteInput[story.id] ?? "",
                          })
                        }
                        className="rounded-lg border border-rose-300/50 bg-rose-500/15 px-3 py-2 text-xs text-rose-100 disabled:opacity-60"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        disabled={busyStoryId === story.id}
                        onClick={() => void applyAction(story.id, `/api/admin/stories/${story.id}/reopen`)}
                        className="rounded-lg border border-amber-300/50 bg-amber-500/15 px-3 py-2 text-xs text-amber-100 disabled:opacity-60"
                      >
                        Reopen
                      </button>
                    </div>
                  </div>
                </div>
              </Panel>
            ))}
          </div>
        )
      ) : null}
    </div>
  );
}
