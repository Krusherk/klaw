import { PublicKey } from "@solana/web3.js";
import { z } from "zod";

import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/lib/constants";
import { STORY_STATUSES } from "@/lib/types";

const X_USERNAME_PATTERN = /^[a-z0-9_]{1,15}$/;
const X_STATUS_PATH_PATTERN = /^\/[A-Za-z0-9_]{1,15}\/status\/\d+(?:\/)?$/;

export const registerSchema = z.object({
  email: z.email(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128, "Password is too long."),
});

export const loginSchema = registerSchema;

export const xUsernameSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/^@+/, "").toLowerCase())
  .refine((value) => X_USERNAME_PATTERN.test(value), {
    message: "X username must match 1-15 chars of letters, numbers, or underscore.",
  });

export const storySubmitSchema = z.object({
  storyText: z.string().trim().min(50).max(5000),
  walletSolana: z
    .string()
    .trim()
    .min(32)
    .max(64)
    .refine((value) => isValidSolanaWallet(value), {
      message: "Invalid Solana wallet address.",
    }),
  country: z.string().trim().min(2).max(64),
});

export const proofSubmitSchema = z.object({
  proofUrl: z.string().trim().url().refine((value) => isValidXStatusUrl(value), {
    message: "Proof URL must be a valid x.com or twitter.com status link.",
  }),
});

export const assignTaskSchema = z.object({
  taskText: z.string().trim().min(10).max(500),
});

export const decisionSchema = z.object({
  decisionNote: z.string().trim().max(280).optional(),
});

export const storyListQuerySchema = z.object({
  status: z.enum(["all", ...STORY_STATUSES]).default("all"),
  q: z.string().trim().max(50).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

export function isValidXStatusUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (!host.endsWith("x.com") && !host.endsWith("twitter.com")) {
      return false;
    }
    return X_STATUS_PATH_PATTERN.test(url.pathname);
  } catch {
    return false;
  }
}

export function isValidSolanaWallet(value: string) {
  try {
    const key = new PublicKey(value);
    return key.toBase58() === value;
  } catch {
    return false;
  }
}
