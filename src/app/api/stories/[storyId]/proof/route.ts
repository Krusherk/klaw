import { requireAuthenticatedUser } from "@/lib/auth";
import { submitProofForStory } from "@/lib/db";
import { ApiError, getClientIp, handleApiError } from "@/lib/http";
import { checkRateLimit } from "@/lib/rate-limit";
import { proofSubmitSchema } from "@/lib/validators";

interface RouteContext {
  params: Promise<{
    storyId: string;
  }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await requireAuthenticatedUser();
    const ip = getClientIp(request);
    const limit = checkRateLimit(`proof-submit:${user.id}:${ip}`, 12, 60_000);
    if (!limit.allowed) {
      throw new ApiError(429, "Too many proof submissions. Try again shortly.");
    }

    const { storyId } = await context.params;
    const body = proofSubmitSchema.parse(await request.json());
    const story = await submitProofForStory({
      storyId,
      userId: user.id,
      proofUrl: body.proofUrl,
    });

    return Response.json({ story });
  } catch (error) {
    return handleApiError(error);
  }
}
