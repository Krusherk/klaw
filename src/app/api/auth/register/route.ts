import { NextResponse } from "next/server";

import { attachSessionCookies } from "@/lib/auth";
import { ensureProfile } from "@/lib/db";
import { ApiError, getClientIp, handleApiError } from "@/lib/http";
import { checkRateLimit } from "@/lib/rate-limit";
import { createSupabaseAnonClient, createSupabaseServiceClient } from "@/lib/supabase";
import { registerSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const limit = checkRateLimit(`register:${ip}`, 5, 60_000);
    if (!limit.allowed) {
      throw new ApiError(429, "Too many registration attempts. Try again shortly.");
    }

    const body = registerSchema.parse(await request.json());
    const serviceClient = createSupabaseServiceClient();
    const { data: created, error: createError } = await serviceClient.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
    });

    if (createError || !created.user) {
      const message = createError?.message ?? "Unable to create account.";
      if (message.toLowerCase().includes("already registered")) {
        throw new ApiError(409, "Email is already registered.");
      }
      throw new ApiError(400, message);
    }

    await ensureProfile(created.user.id, created.user.email ?? body.email);

    const anonClient = createSupabaseAnonClient();
    const { data: sessionData, error: signInError } = await anonClient.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    });

    if (signInError || !sessionData.user || !sessionData.session) {
      throw new ApiError(500, "Unable to create account.");
    }

    const response = NextResponse.json({
      user: {
        id: sessionData.user.id,
        email: sessionData.user.email,
      },
      requiresEmailVerification: false,
    });
    attachSessionCookies(response, sessionData.session);

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
