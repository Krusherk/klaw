import { requireAuthenticatedUser } from "@/lib/auth";
import { setProfileXUsername } from "@/lib/db";
import { handleApiError } from "@/lib/http";
import { xUsernameSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedUser();
    const body = await request.json();
    const xUsername = xUsernameSchema.parse(body.xUsername);

    const profile = await setProfileXUsername(user.id, xUsername);
    return Response.json({
      xUsername: profile.x_username,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
