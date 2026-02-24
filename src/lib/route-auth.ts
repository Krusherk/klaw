import type { User } from "@supabase/supabase-js";

import { requireAuthenticatedUser } from "@/lib/auth";
import { isAdminEmail } from "@/lib/env";
import { ApiError } from "@/lib/http";

export async function requireAdminUser(): Promise<User> {
  const user = await requireAuthenticatedUser();
  if (!isAdminEmail(user.email)) {
    throw new ApiError(403, "Admin access required.");
  }
  return user;
}
