import { requireAdminUser } from "@/lib/route-auth";
import { createSupabaseServiceClient } from "@/lib/supabase";

interface CheckResult {
  target: string;
  kind: "table" | "view";
  ok: boolean;
  message?: string;
}

function isMissingRelationMessage(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("could not find the table") ||
    (normalized.includes("relation") && normalized.includes("does not exist"))
  );
}

async function checkRelation(target: string, kind: "table" | "view"): Promise<CheckResult> {
  const supabase = createSupabaseServiceClient();
  const { error } = await supabase.from(target).select("*", { head: true, count: "exact" }).limit(1);

  if (!error) {
    return { target, kind, ok: true };
  }

  if (isMissingRelationMessage(error.message)) {
    return {
      target,
      kind,
      ok: false,
      message: "Missing relation in Supabase schema cache.",
    };
  }

  return {
    target,
    kind,
    ok: false,
    message: error.message,
  };
}

export async function GET() {
  try {
    await requireAdminUser();

    const checks = await Promise.all([
      checkRelation("profiles", "table"),
      checkRelation("stories", "table"),
      checkRelation("story_tasks", "table"),
      checkRelation("story_task_events", "table"),
      checkRelation("site_settings", "table"),
      checkRelation("story_feed_public", "view"),
    ]);

    const supabase = createSupabaseServiceClient();
    const { data: realtimeRows, error: realtimeError } = await supabase.rpc("realtime_table_status");

    const realtime = !realtimeError
      ? realtimeRows
      : {
          error: realtimeError.message,
        };

    const missing = checks.filter((item) => !item.ok).map((item) => item.target);

    return Response.json({
      ok: missing.length === 0,
      checks,
      missing,
      realtime,
      recommendation:
        missing.length === 0
          ? "Schema looks good."
          : "Run supabase/migrations/0001_initial.sql and supabase/migrations/0002_realtime.sql in your Supabase SQL editor, then redeploy.",
    });
  } catch (error) {
    if (error instanceof Error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
    return Response.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
