export const STORY_STATUSES = ["normal", "pending", "approved", "rejected"] as const;
export type StoryStatus = (typeof STORY_STATUSES)[number];

export const TASK_STATES = [
  "awaiting_proof",
  "proof_submitted",
  "approved",
  "rejected",
] as const;
export type TaskState = (typeof TASK_STATES)[number];

export interface StatusCounts {
  all: number;
  normal: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface StoryPublic {
  id: string;
  xUsername: string;
  storyText: string;
  status: StoryStatus;
  submittedAt: string;
  createdAt: string;
  taskText: string | null;
}

export interface StoryTask {
  id: string;
  taskText: string;
  state: TaskState;
  proofUrl: string | null;
  proofSubmittedAt: string | null;
  decisionNote: string | null;
  reviewedAt: string | null;
  assignedAt: string;
}

export interface StoryOwner extends StoryPublic {
  task: StoryTask | null;
}

export interface StoryAdmin extends StoryOwner {
  userId: string;
  walletSolana: string;
  country: string;
}

export interface StoriesPageResult<TStory> {
  stories: TStory[];
  page: number;
  pageSize: number;
  total: number;
  counts: StatusCounts;
}
