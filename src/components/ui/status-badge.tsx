import { cn, statusLabel } from "@/lib/utils";
import type { StoryStatus } from "@/lib/types";

const badgeClass: Record<StoryStatus, string> = {
  normal: "border-slate-400/35 bg-slate-500/15 text-slate-100",
  pending: "border-amber-400/40 bg-amber-500/15 text-amber-100",
  approved: "border-emerald-400/45 bg-emerald-500/15 text-emerald-100",
  rejected: "border-rose-400/45 bg-rose-500/15 text-rose-100",
};

export function StatusBadge({ status }: { status: StoryStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]",
        badgeClass[status],
      )}
    >
      {statusLabel(status)}
    </span>
  );
}
