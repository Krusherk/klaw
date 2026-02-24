import { requireAuthenticatedUser } from "@/lib/auth";
import { createStory, listPublicStories } from "@/lib/db";
import { ApiError, getClientIp, handleApiError } from "@/lib/http";
import { checkRateLimit } from "@/lib/rate-limit";
import { storyListQuerySchema, storySubmitSchema } from "@/lib/validators";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const params = storyListQuerySchema.parse({
      status: url.searchParams.get("status") ?? undefined,
      q: url.searchParams.get("q") ?? undefined,
      page: url.searchParams.get("page") ?? undefined,
      pageSize: url.searchParams.get("pageSize") ?? undefined,
    });

    const result = await listPublicStories(params);
    return Response.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedUser();
    const ip = getClientIp(request);
    const limit = checkRateLimit(`story-submit:${user.id}:${ip}`, 8, 60_000);
    if (!limit.allowed) {
      throw new ApiError(429, "Too many submission attempts. Try again shortly.");
    }

    const body = storySubmitSchema.parse(await request.json());
    const story = await createStory({
      userId: user.id,
      storyText: body.storyText,
      walletSolana: body.walletSolana,
      country: body.country,
    });

    return Response.json({ story }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
