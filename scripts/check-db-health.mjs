import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const relations = [
  { target: "profiles", kind: "table" },
  { target: "stories", kind: "table" },
  { target: "story_tasks", kind: "table" },
  { target: "story_task_events", kind: "table" },
  { target: "site_settings", kind: "table" },
  { target: "story_feed_public", kind: "view" },
];

function isMissing(error) {
  const message = String(error?.message ?? "").toLowerCase();
  return message.includes("could not find the table") || (message.includes("relation") && message.includes("does not exist"));
}

for (const relation of relations) {
  const { error } = await supabase.from(relation.target).select("*", { head: true, count: "exact" }).limit(1);
  if (!error) {
    console.log(`OK ${relation.kind}: ${relation.target}`);
    continue;
  }
  if (isMissing(error)) {
    console.log(`MISSING ${relation.kind}: ${relation.target}`);
  } else {
    console.log(`ERROR ${relation.kind}: ${relation.target} -> ${error.message}`);
  }
}

const { data: realtime, error: realtimeError } = await supabase.rpc("realtime_table_status");
if (realtimeError) {
  console.log(`Realtime status error: ${realtimeError.message}`);
} else {
  for (const row of realtime ?? []) {
    console.log(`REALTIME ${row.table_name}: ${row.in_realtime ? "enabled" : "disabled"}`);
  }
}
