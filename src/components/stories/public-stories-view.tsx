"use client";

import { useEffect, useMemo, useState } from "react";

import { Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiRequest } from "@/lib/api";
import type { StatusCounts, StoryPublic, StoryStatus, StoriesPageResult } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const statuses: Array<{ value: "all" | StoryStatus; label: string }> = [
  { value: "all", label: "All" },
  { value: "normal", label: "Normal" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const emptyCounts: StatusCounts = {
  all: 0,
  normal: 0,
  pending: 0,
  approved: 0,
  rejected: 0,
};

export function PublicStoriesView() {
  const [status, setStatus] = useState<"all" | StoryStatus>("all");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"hybrid" | "compact">("hybrid");
  const [result, setResult] = useState<StoriesPageResult<StoryPublic> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await apiRequest<StoriesPageResult<StoryPublic>>(
          `/api/stories?status=${status}&q=${encodeURIComponent(appliedSearch)}&page=${page}&pageSize=20`,
          { cache: "no-store" },
        );
        if (active) {
          setResult(data);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load stories.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [status, appliedSearch, page]);

  const pageTotal = useMemo(() => {
    if (!result) {
      return 1;
    }
    return Math.max(1, Math.ceil(result.total / result.pageSize));
  }, [result]);

  return (
    <div className="page-enter space-y-5">
      <Panel>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-heading text-3xl">Story Feed</h1>
            <p className="mt-2 text-sm text-slate-300">
              Public statuses are transparent. Wallet and country stay private to admin.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={`rounded-full px-3 py-1.5 text-xs ${
                viewMode === "hybrid"
                  ? "bg-violet-500 text-white"
                  : "border border-white/20 bg-white/5 text-slate-200"
              }`}
              onClick={() => setViewMode("hybrid")}
            >
              Hybrid
            </button>
            <button
              type="button"
              className={`rounded-full px-3 py-1.5 text-xs ${
                viewMode === "compact"
                  ? "bg-violet-500 text-white"
                  : "border border-white/20 bg-white/5 text-slate-200"
              }`}
              onClick={() => setViewMode("compact")}
            >
              Compact
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {statuses.map((item) => {
              const count = (result?.counts ?? emptyCounts)[item.value];
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => {
                    setStatus(item.value);
                    setPage(1);
                  }}
                  className={`rounded-full border px-3 py-1.5 text-xs transition ${
                    status === item.value
                      ? "border-violet-400/80 bg-violet-500/20 text-white"
                      : "border-white/15 bg-white/[0.03] text-slate-200 hover:border-violet-300/40"
                  }`}
                >
                  {item.label} ({count})
                </button>
              );
            })}
          </div>

          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              setPage(1);
              setAppliedSearch(search.trim());
            }}
          >
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by X username"
              className="w-full rounded-xl border border-white/15 bg-[#0f1426] px-3 py-2 text-sm text-white outline-none focus:border-violet-400/70"
            />
            <button
              type="submit"
              className="rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white"
            >
              Search
            </button>
          </form>
        </div>
      </Panel>

      {loading ? <Panel>Loading stories...</Panel> : null}
      {error ? <Panel className="border-rose-400/40 text-rose-200">{error}</Panel> : null}

      {!loading && !error && result ? (
        <div className="space-y-3">
          {result.stories.length === 0 ? (
            <Panel>No stories found for this filter.</Panel>
          ) : viewMode === "compact" ? (
            <Panel className="overflow-hidden p-0">
              <div className="divide-y divide-white/10">
                {result.stories.map((story) => (
                  <div key={story.id} className="grid gap-2 px-4 py-3 md:grid-cols-[150px_1fr_140px] md:items-center">
                    <div className="text-xs text-slate-400">@{story.xUsername}</div>
                    <p className="line-clamp-2 text-sm text-slate-100">{story.storyText}</p>
                    <div className="flex items-center justify-between gap-2 md:justify-end">
                      <StatusBadge status={story.status} />
                      <span className="text-xs text-slate-400">{formatDate(story.submittedAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {result.stories.map((story) => (
                <Panel key={story.id} className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs text-violet-200">@{story.xUsername}</div>
                    <StatusBadge status={story.status} />
                  </div>
                  <p className="line-clamp-4 text-sm leading-relaxed text-slate-200">{story.storyText}</p>
                  {story.taskText ? (
                    <div className="rounded-xl border border-white/12 bg-white/[0.03] px-3 py-2 text-xs text-slate-300">
                      <strong className="mr-1 text-slate-100">Task:</strong>
                      {story.taskText}
                    </div>
                  ) : null}
                  <p className="text-xs text-slate-400">Submitted {formatDate(story.submittedAt)}</p>
                </Panel>
              ))}
            </div>
          )}

          <Panel>
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-300">
                Page {page} of {pageTotal}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="rounded-lg border border-white/20 px-3 py-1.5 text-xs disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= pageTotal}
                  onClick={() => setPage((current) => current + 1)}
                  className="rounded-lg border border-white/20 px-3 py-1.5 text-xs disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </Panel>
        </div>
      ) : null}
    </div>
  );
}
