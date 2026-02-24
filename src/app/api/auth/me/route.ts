import { getAuthenticatedUser } from "@/lib/auth";
import { getProfileByUserId } from "@/lib/db";
import { env, isAdminEmail } from "@/lib/env";
import { handleApiError } from "@/lib/http";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ user: null });
    }

    const admin = isAdminEmail(user.email);
    let xUsername: string | null = null;
    let profileUnavailable = false;

    try {
      const profile = await getProfileByUserId(user.id);
      xUsername = profile?.x_username ?? null;
    } catch {
      // Keep session UX working even when DB/profile lookup is temporarily unavailable.
      profileUnavailable = true;
    }

    return Response.json({
      user: {
        id: user.id,
        email: user.email,
        isAdmin: admin,
        adminDisplayName: admin ? env.adminDisplayName : null,
      },
      profile: {
        xUsername,
      },
      meta: {
        profileUnavailable,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
