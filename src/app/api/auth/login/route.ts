import { NextResponse } from "next/server";

import { attachSessionCookies } from "@/lib/auth";
import { ensureProfile } from "@/lib/db";
import { ApiError, getClientIp, handleApiError } from "@/lib/http";
import { checkRateLimit } from "@/lib/rate-limit";
import { createSupabaseAnonClient } from "@/lib/supabase";
import { loginSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const limit = checkRateLimit(`login:${ip}`, 10, 60_000);
    if (!limit.allowed) {
      throw new ApiError(429, "Too many login attempts. Try again shortly.");
    }

    const body = loginSchema.parse(await request.json());
    const supabase = createSupabaseAnonClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    });

    if (error || !data.user || !data.session) {
      throw new ApiError(401, error?.message ?? "Invalid login credentials.");
    }

    await ensureProfile(data.user.id, data.user.email ?? body.email);

    const response = NextResponse.json({
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    });
    attachSessionCookies(response, data.session);
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
