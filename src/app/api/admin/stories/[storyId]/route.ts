import { getAdminStoryById } from "@/lib/db";
import { handleApiError } from "@/lib/http";
import { requireAdminUser } from "@/lib/route-auth";

interface RouteContext {
  params: Promise<{
    storyId: string;
  }>;
}

export async function GET(_: Request, context: RouteContext) {
  try {
    await requireAdminUser();
    const { storyId } = await context.params;
    const story = await getAdminStoryById(storyId);
    return Response.json({ story });
  } catch (error) {
    return handleApiError(error);
  }
}
