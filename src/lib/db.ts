import { PostgrestError } from "@supabase/supabase-js";

import { ApiError } from "@/lib/http";
import { createSupabaseServiceClient } from "@/lib/supabase";
import type {
  StatusCounts,
  StoryAdmin,
  StoryOwner,
  StoryPublic,
  StoryTask,
  StoriesPageResult,
  StoryStatus,
} from "@/lib/types";

interface StoryFilters {
  status: StoryStatus | "all";
  q?: string;
  page: number;
  pageSize: number;
}

function extractMissingTableName(message: string) {
  const match = message.match(/table 'public\.([a-zA-Z0-9_]+)'/i);
  if (match?.[1]) {
    return `public.${match[1]}`;
  }
  return null;
}

function isSchemaMissingError(error: PostgrestError) {
  const code = (error.code ?? "").toUpperCase();
  const message = `${error.message} ${error.details ?? ""}`.toLowerCase();
  if (code === "PGRST205" || code === "42P01") {
    return true;
  }
  if (message.includes("could not find the table")) {
    return true;
  }
  if (message.includes("relation") && message.includes("does not exist")) {
    return true;
  }
  return false;
}

function mapPostgresError(error: PostgrestError): never {
  if (error.code === "23505") {
    throw new ApiError(409, "This action violates a unique constraint.");
  }
  if (isSchemaMissingError(error)) {
    const relation = extractMissingTableName(error.message);
    const relationPart = relation ? ` Missing relation: ${relation}.` : "";
    throw new ApiError(
      500,
      `Database schema is not initialized for this Supabase project.${relationPart} Run all SQL migrations in order: supabase/migrations/0001_initial.sql then supabase/migrations/0002_realtime.sql.`,
    );
  }
  throw new ApiError(500, error.message);
}

function normalizeNullableText(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function unwrapTask(relation: unknown): Record<string, unknown> | null {
  if (Array.isArray(relation)) {
    const task = relation[0];
    if (task && typeof task === "object") {
      return task as Record<string, unknown>;
    }
    return null;
  }
  if (relation && typeof relation === "object") {
    return relation as Record<string, unknown>;
  }
  return null;
}

function mapTask(taskRow: Record<string, unknown> | null): StoryTask | null {
  if (!taskRow) {
    return null;
  }
  return {
    id: String(taskRow.id),
    taskText: String(taskRow.task_text ?? ""),
    state: String(taskRow.state ?? "awaiting_proof") as StoryTask["state"],
    proofUrl: normalizeNullableText(taskRow.proof_url),
    proofSubmittedAt: normalizeNullableText(taskRow.proof_submitted_at),
    decisionNote: normalizeNullableText(taskRow.decision_note),
    reviewedAt: normalizeNullableText(taskRow.reviewed_at),
    assignedAt: String(taskRow.assigned_at ?? ""),
  };
}

function mapPublicStory(row: Record<string, unknown>): StoryPublic {
  return {
    id: String(row.id),
    xUsername: String(row.x_username),
    storyText: String(row.story_text),
    status: String(row.status) as StoryPublic["status"],
    submittedAt: String(row.submitted_at),
    createdAt: String(row.created_at),
    taskText: normalizeNullableText(row.task_text),
  };
}

function mapOwnerStory(row: Record<string, unknown>): StoryOwner {
  return {
    ...mapPublicStory(row),
    task: mapTask(unwrapTask(row.story_tasks)),
  };
}

function mapAdminStory(row: Record<string, unknown>): StoryAdmin {
  return {
    ...mapOwnerStory(row),
    userId: String(row.user_id),
    walletSolana: String(row.wallet_solana),
    country: String(row.country),
  };
}

async function getCounts(filter: Pick<StoryFilters, "q">): Promise<StatusCounts> {
  const supabase = createSupabaseServiceClient();

  async function countFor(status?: StoryStatus) {
    let query = supabase.from("stories").select("id", { head: true, count: "exact" });
    if (status) {
      query = query.eq("status", status);
    }
    if (filter.q) {
      query = query.ilike("x_username", `%${filter.q}%`);
    }
    const { count, error } = await query;
    if (error) {
      mapPostgresError(error);
    }
    return count ?? 0;
  }

  const [all, normal, pending, approved, rejected] = await Promise.all([
    countFor(),
    countFor("normal"),
    countFor("pending"),
    countFor("approved"),
    countFor("rejected"),
  ]);

  return {
    all,
    normal,
    pending,
    approved,
    rejected,
  };
}

export async function ensureProfile(userId: string, email: string) {
  const supabase = createSupabaseServiceClient();

  const { data: existing, error: selectError } = await supabase
    .from("profiles")
    .select("id, email, x_username")
    .eq("id", userId)
    .maybeSingle();

  if (selectError) {
    mapPostgresError(selectError);
  }

  if (!existing) {
    const { data: created, error: insertError } = await supabase
      .from("profiles")
      .insert({ id: userId, email })
      .select("id, email, x_username")
      .single();

    if (insertError) {
      mapPostgresError(insertError);
    }

    return created;
  }

  if (existing.email !== email) {
    const { data: updated, error: updateError } = await supabase
      .from("profiles")
      .update({ email })
      .eq("id", userId)
      .select("id, email, x_username")
      .single();

    if (updateError) {
      mapPostgresError(updateError);
    }

    return updated;
  }

  return existing;
}

export async function getProfileByUserId(userId: string) {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, x_username")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    mapPostgresError(error);
  }
  return data;
}

export async function setProfileXUsername(userId: string, xUsername: string) {
  const supabase = createSupabaseServiceClient();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, x_username")
    .eq("id", userId)
    .single();

  if (profileError) {
    mapPostgresError(profileError);
  }

  if (!profile) {
    throw new ApiError(404, "Profile not found.");
  }

  if (profile.x_username && profile.x_username !== xUsername) {
    throw new ApiError(409, "X username is immutable once set.");
  }

  if (profile.x_username === xUsername) {
    return profile;
  }

  const { data: updated, error: updateError } = await supabase
    .from("profiles")
    .update({ x_username: xUsername })
    .eq("id", userId)
    .select("id, x_username")
    .single();

  if (updateError) {
    if (updateError.code === "23505") {
      throw new ApiError(409, "X username already taken.");
    }
    mapPostgresError(updateError);
  }

  return updated;
}

export async function createStory(params: {
  userId: string;
  storyText: string;
  walletSolana: string;
  country: string;
}) {
  const supabase = createSupabaseServiceClient();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("x_username")
    .eq("id", params.userId)
    .single();

  if (profileError) {
    mapPostgresError(profileError);
  }

  const xUsername = normalizeNullableText(profile?.x_username);
  if (!xUsername) {
    throw new ApiError(400, "Set your X username before posting a story.");
  }

  const { data, error } = await supabase
    .from("stories")
    .insert({
      user_id: params.userId,
      x_username: xUsername,
      story_text: params.storyText,
      wallet_solana: params.walletSolana,
      country: params.country,
    })
    .select("id, x_username, story_text, status, submitted_at, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new ApiError(409, "Only one submission per UTC day is allowed.");
    }
    mapPostgresError(error);
  }

  return {
    ...mapPublicStory(data as Record<string, unknown>),
    task: null,
  } as StoryOwner;
}

export async function listPublicStories(
  filters: StoryFilters,
): Promise<StoriesPageResult<StoryPublic>> {
  const supabase = createSupabaseServiceClient();

  let query = supabase
    .from("story_feed_public")
    .select("id, x_username, story_text, status, submitted_at, created_at, task_text", {
      count: "exact",
    });

  if (filters.status !== "all") {
    query = query.eq("status", filters.status);
  }
  if (filters.q) {
    query = query.ilike("x_username", `%${filters.q}%`);
  }

  const from = (filters.page - 1) * filters.pageSize;
  const to = from + filters.pageSize - 1;

  const { data, error, count } = await query
    .order("submitted_at", { ascending: true })
    .range(from, to);

  if (error) {
    mapPostgresError(error);
  }

  const counts = await getCounts({ q: filters.q });

  return {
    stories: (data ?? []).map((item) => mapPublicStory(item as Record<string, unknown>)),
    page: filters.page,
    pageSize: filters.pageSize,
    total: count ?? 0,
    counts,
  };
}

export async function listMyStories(userId: string): Promise<StoryOwner[]> {
  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase
    .from("stories")
    .select(
      "id, user_id, x_username, story_text, status, submitted_at, created_at, story_tasks(id, task_text, state, proof_url, proof_submitted_at, decision_note, reviewed_at, assigned_at)",
    )
    .eq("user_id", userId)
    .order("submitted_at", { ascending: true });

  if (error) {
    mapPostgresError(error);
  }

  return (data ?? []).map((row) => mapOwnerStory(row as Record<string, unknown>));
}

async function insertTaskEvent(params: {
  storyId: string;
  taskId: string | null;
  eventType: "task_assigned" | "proof_submitted" | "approved" | "rejected" | "reopened";
  actorUserId: string;
  eventNote?: string;
  payload?: Record<string, unknown>;
}) {
  const supabase = createSupabaseServiceClient();
  const { error } = await supabase.from("story_task_events").insert({
    story_id: params.storyId,
    task_id: params.taskId,
    event_type: params.eventType,
    actor_user_id: params.actorUserId,
    event_note: params.eventNote ?? null,
    event_payload: params.payload ?? {},
  });

  if (error) {
    mapPostgresError(error);
  }
}

async function getStoryWithTask(storyId: string) {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("stories")
    .select(
      "id, user_id, x_username, story_text, status, submitted_at, created_at, wallet_solana, country, story_tasks(id, task_text, state, proof_url, proof_submitted_at, decision_note, reviewed_at, assigned_at)",
    )
    .eq("id", storyId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      throw new ApiError(404, "Story not found.");
    }
    mapPostgresError(error);
  }

  return data as Record<string, unknown>;
}

export async function submitProofForStory(params: {
  storyId: string;
  userId: string;
  proofUrl: string;
}) {
  const supabase = createSupabaseServiceClient();
  const story = await getStoryWithTask(params.storyId);

  if (story.user_id !== params.userId) {
    throw new ApiError(403, "You can only submit proof for your own story.");
  }
  if (story.status !== "pending") {
    throw new ApiError(409, "Proof can only be submitted when story status is pending.");
  }

  const task = mapTask(unwrapTask(story.story_tasks));
  if (!task) {
    throw new ApiError(409, "No task is assigned to this story.");
  }

  const { error: updateError } = await supabase
    .from("story_tasks")
    .update({
      state: "proof_submitted",
      proof_url: params.proofUrl,
      proof_submitted_at: new Date().toISOString(),
      decision_note: null,
      reviewed_at: null,
      reviewed_by: null,
    })
    .eq("id", task.id);

  if (updateError) {
    mapPostgresError(updateError);
  }

  await insertTaskEvent({
    storyId: params.storyId,
    taskId: task.id,
    eventType: "proof_submitted",
    actorUserId: params.userId,
    eventNote: "Proof submitted by owner.",
    payload: { proofUrl: params.proofUrl },
  });

  return mapOwnerStory(await getStoryWithTask(params.storyId));
}

export async function listAdminStories(
  filters: StoryFilters,
): Promise<StoriesPageResult<StoryAdmin>> {
  const supabase = createSupabaseServiceClient();

  let query = supabase
    .from("stories")
    .select(
      "id, user_id, x_username, story_text, status, submitted_at, created_at, wallet_solana, country, story_tasks(id, task_text, state, proof_url, proof_submitted_at, decision_note, reviewed_at, assigned_at)",
      { count: "exact" },
    );

  if (filters.status !== "all") {
    query = query.eq("status", filters.status);
  }
  if (filters.q) {
    query = query.ilike("x_username", `%${filters.q}%`);
  }

  const from = (filters.page - 1) * filters.pageSize;
  const to = from + filters.pageSize - 1;

  const { data, error, count } = await query
    .order("submitted_at", { ascending: true })
    .range(from, to);

  if (error) {
    mapPostgresError(error);
  }

  const counts = await getCounts({ q: filters.q });

  return {
    stories: (data ?? []).map((item) => mapAdminStory(item as Record<string, unknown>)),
    page: filters.page,
    pageSize: filters.pageSize,
    total: count ?? 0,
    counts,
  };
}

export async function getAdminStoryById(storyId: string): Promise<StoryAdmin> {
  const story = await getStoryWithTask(storyId);
  return mapAdminStory(story);
}

export async function assignTaskToStory(params: {
  storyId: string;
  adminUserId: string;
  taskText: string;
}) {
  const supabase = createSupabaseServiceClient();
  const story = await getStoryWithTask(params.storyId);

  if (story.status === "approved") {
    throw new ApiError(409, "Approved stories cannot be reassigned.");
  }

  const existingTask = mapTask(unwrapTask(story.story_tasks));

  let taskId = existingTask?.id;
  if (taskId) {
    const { error: updateTaskError } = await supabase
      .from("story_tasks")
      .update({
        task_text: params.taskText,
        state: "awaiting_proof",
        proof_url: null,
        proof_submitted_at: null,
        decision_note: null,
        reviewed_by: null,
        reviewed_at: null,
        assigned_by: params.adminUserId,
        assigned_at: new Date().toISOString(),
      })
      .eq("id", taskId);

    if (updateTaskError) {
      mapPostgresError(updateTaskError);
    }
  } else {
    const { data: insertedTask, error: insertTaskError } = await supabase
      .from("story_tasks")
      .insert({
        story_id: params.storyId,
        task_text: params.taskText,
        state: "awaiting_proof",
        assigned_by: params.adminUserId,
      })
      .select("id")
      .single();

    if (insertTaskError) {
      mapPostgresError(insertTaskError);
    }

    taskId = String(insertedTask.id);
  }

  const { error: updateStoryError } = await supabase
    .from("stories")
    .update({ status: "pending" })
    .eq("id", params.storyId);

  if (updateStoryError) {
    mapPostgresError(updateStoryError);
  }

  await insertTaskEvent({
    storyId: params.storyId,
    taskId: taskId ?? null,
    eventType: "task_assigned",
    actorUserId: params.adminUserId,
    eventNote: params.taskText,
  });

  return getAdminStoryById(params.storyId);
}

export async function approveStoryTask(params: {
  storyId: string;
  adminUserId: string;
  decisionNote?: string;
}) {
  const supabase = createSupabaseServiceClient();
  const story = await getStoryWithTask(params.storyId);

  if (story.status !== "pending") {
    throw new ApiError(409, "Only pending stories can be approved.");
  }

  const task = mapTask(unwrapTask(story.story_tasks));
  if (!task) {
    throw new ApiError(409, "No active task found.");
  }
  if (!task.proofUrl || task.state !== "proof_submitted") {
    throw new ApiError(409, "Proof must be submitted before approval.");
  }

  const now = new Date().toISOString();
  const { error: taskError } = await supabase
    .from("story_tasks")
    .update({
      state: "approved",
      reviewed_by: params.adminUserId,
      reviewed_at: now,
      decision_note: params.decisionNote ?? null,
    })
    .eq("id", task.id);

  if (taskError) {
    mapPostgresError(taskError);
  }

  const { error: storyError } = await supabase
    .from("stories")
    .update({ status: "approved" })
    .eq("id", params.storyId);

  if (storyError) {
    mapPostgresError(storyError);
  }

  await insertTaskEvent({
    storyId: params.storyId,
    taskId: task.id,
    eventType: "approved",
    actorUserId: params.adminUserId,
    eventNote: params.decisionNote,
  });

  return getAdminStoryById(params.storyId);
}

export async function rejectStoryTask(params: {
  storyId: string;
  adminUserId: string;
  decisionNote?: string;
}) {
  const supabase = createSupabaseServiceClient();
  const story = await getStoryWithTask(params.storyId);

  if (story.status !== "pending") {
    throw new ApiError(409, "Only pending stories can be rejected.");
  }

  const task = mapTask(unwrapTask(story.story_tasks));
  if (!task) {
    throw new ApiError(409, "No active task found.");
  }

  const now = new Date().toISOString();
  const { error: taskError } = await supabase
    .from("story_tasks")
    .update({
      state: "rejected",
      reviewed_by: params.adminUserId,
      reviewed_at: now,
      decision_note: params.decisionNote ?? null,
    })
    .eq("id", task.id);

  if (taskError) {
    mapPostgresError(taskError);
  }

  const { error: storyError } = await supabase
    .from("stories")
    .update({ status: "rejected" })
    .eq("id", params.storyId);

  if (storyError) {
    mapPostgresError(storyError);
  }

  await insertTaskEvent({
    storyId: params.storyId,
    taskId: task.id,
    eventType: "rejected",
    actorUserId: params.adminUserId,
    eventNote: params.decisionNote,
  });

  return getAdminStoryById(params.storyId);
}

export async function reopenStoryTask(params: {
  storyId: string;
  adminUserId: string;
}) {
  const supabase = createSupabaseServiceClient();
  const story = await getStoryWithTask(params.storyId);

  if (story.status !== "rejected") {
    throw new ApiError(409, "Only rejected stories can be reopened.");
  }

  const task = mapTask(unwrapTask(story.story_tasks));
  if (!task) {
    throw new ApiError(409, "No task found to reopen.");
  }

  const { error: taskError } = await supabase
    .from("story_tasks")
    .update({
      state: "awaiting_proof",
      proof_url: null,
      proof_submitted_at: null,
      decision_note: null,
      reviewed_by: null,
      reviewed_at: null,
    })
    .eq("id", task.id);

  if (taskError) {
    mapPostgresError(taskError);
  }

  const { error: storyError } = await supabase
    .from("stories")
    .update({ status: "pending" })
    .eq("id", params.storyId);

  if (storyError) {
    mapPostgresError(storyError);
  }

  await insertTaskEvent({
    storyId: params.storyId,
    taskId: task.id,
    eventType: "reopened",
    actorUserId: params.adminUserId,
    eventNote: "Rejected task reopened for new proof.",
  });

  return getAdminStoryById(params.storyId);
}
