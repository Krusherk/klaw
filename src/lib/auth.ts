import type { Session, User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/lib/constants";
import { ApiError } from "@/lib/http";
import { createSupabaseAnonClient } from "@/lib/supabase";

const isProd = process.env.NODE_ENV === "production";

function cookieSettings(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export function attachSessionCookies(response: NextResponse, session: Session) {
  response.cookies.set(
    ACCESS_TOKEN_COOKIE,
    session.access_token,
    cookieSettings(session.expires_in ?? 3600),
  );
  response.cookies.set(
    REFRESH_TOKEN_COOKIE,
    session.refresh_token,
    cookieSettings(60 * 60 * 24 * 30),
  );
}

export function clearSessionCookies(response: NextResponse) {
  response.cookies.set(ACCESS_TOKEN_COOKIE, "", cookieSettings(0));
  response.cookies.set(REFRESH_TOKEN_COOKIE, "", cookieSettings(0));
}

export async function getAuthenticatedUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    return null;
  }

  const supabase = createSupabaseAnonClient();
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) {
    return null;
  }
  return data.user;
}

export async function requireAuthenticatedUser() {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new ApiError(401, "Unauthorized");
  }
  return user;
}
