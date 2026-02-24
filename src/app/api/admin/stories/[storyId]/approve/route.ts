import { requireAdminUser } from "@/lib/route-auth";
import { approveStoryTask } from "@/lib/db";
import { handleApiError } from "@/lib/http";
import { decisionSchema } from "@/lib/validators";

interface RouteContext {
  params: Promise<{
    storyId: string;
  }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await requireAdminUser();
    const { storyId } = await context.params;
    const body = decisionSchema.parse(await request.json());

    const story = await approveStoryTask({
      storyId,
      adminUserId: user.id,
      decisionNote: body.decisionNote,
    });

    return Response.json({ story });
  } catch (error) {
    return handleApiError(error);
  }
}
