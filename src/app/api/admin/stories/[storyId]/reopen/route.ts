import { requireAdminUser } from "@/lib/route-auth";
import { reopenStoryTask } from "@/lib/db";
import { handleApiError } from "@/lib/http";

interface RouteContext {
  params: Promise<{
    storyId: string;
  }>;
}

export async function POST(_: Request, context: RouteContext) {
  try {
    const user = await requireAdminUser();
    const { storyId } = await context.params;
    const story = await reopenStoryTask({
      storyId,
      adminUserId: user.id,
    });

    return Response.json({ story });
  } catch (error) {
    return handleApiError(error);
  }
}
