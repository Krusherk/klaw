import { requireAdminUser } from "@/lib/route-auth";
import { listAdminStories } from "@/lib/db";
import { handleApiError } from "@/lib/http";
import { storyListQuerySchema } from "@/lib/validators";

export async function GET(request: Request) {
  try {
    await requireAdminUser();

    const url = new URL(request.url);
    const params = storyListQuerySchema.parse({
      status: url.searchParams.get("status") ?? undefined,
      q: url.searchParams.get("q") ?? undefined,
      page: url.searchParams.get("page") ?? undefined,
      pageSize: url.searchParams.get("pageSize") ?? undefined,
    });

    const result = await listAdminStories(params);
    return Response.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
