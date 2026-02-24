import { requireAuthenticatedUser } from "@/lib/auth";
import { listMyStories } from "@/lib/db";
import { handleApiError } from "@/lib/http";

export async function GET() {
  try {
    const user = await requireAuthenticatedUser();
    const stories = await listMyStories(user.id);
    return Response.json({ stories });
  } catch (error) {
    return handleApiError(error);
  }
}
