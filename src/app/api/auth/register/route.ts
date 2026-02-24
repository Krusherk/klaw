import { NextResponse } from "next/server";

import { attachSessionCookies } from "@/lib/auth";
import { ensureProfile } from "@/lib/db";
import { ApiError, getClientIp, handleApiError } from "@/lib/http";
import { checkRateLimit } from "@/lib/rate-limit";
import { createSupabaseAnonClient } from "@/lib/supabase";
import { registerSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const limit = checkRateLimit(`register:${ip}`, 5, 60_000);
    if (!limit.allowed) {
      throw new ApiError(429, "Too many registration attempts. Try again shortly.");
    }

    const body = registerSchema.parse(await request.json());
    const supabase = createSupabaseAnonClient();
    const { data, error } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
    });

    if (error) {
      throw new ApiError(400, error.message);
    }
    if (!data.user) {
      throw new ApiError(500, "Unable to create account.");
    }

    await ensureProfile(data.user.id, data.user.email ?? body.email);

    const response = NextResponse.json({
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      requiresEmailVerification: !data.session,
    });

    if (data.session) {
      attachSessionCookies(response, data.session);
    }

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
