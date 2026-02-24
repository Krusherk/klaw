import { getAuthenticatedUser } from "@/lib/auth";
import { getProfileByUserId } from "@/lib/db";
import { handleApiError } from "@/lib/http";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ user: null });
    }

    const profile = await getProfileByUserId(user.id);
    return Response.json({
      user: {
        id: user.id,
        email: user.email,
      },
      profile: {
        xUsername: profile?.x_username ?? null,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
