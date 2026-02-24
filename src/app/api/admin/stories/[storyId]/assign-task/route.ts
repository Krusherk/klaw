import { requireAdminUser } from "@/lib/route-auth";
import { assignTaskToStory } from "@/lib/db";
import { handleApiError } from "@/lib/http";
import { assignTaskSchema } from "@/lib/validators";

interface RouteContext {
  params: Promise<{
    storyId: string;
  }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await requireAdminUser();
    const { storyId } = await context.params;
    const body = assignTaskSchema.parse(await request.json());
    const story = await assignTaskToStory({
      storyId,
      adminUserId: user.id,
      taskText: body.taskText,
    });

    return Response.json({ story });
  } catch (error) {
    return handleApiError(error);
  }
}
