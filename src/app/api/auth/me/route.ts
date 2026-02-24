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

    const profile = await getProfileByUserId(user.id);
    const admin = isAdminEmail(user.email);
    return Response.json({
      user: {
        id: user.id,
        email: user.email,
        isAdmin: admin,
        adminDisplayName: admin ? env.adminDisplayName : null,
      },
      profile: {
        xUsername: profile?.x_username ?? null,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
