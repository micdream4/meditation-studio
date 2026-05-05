import { NextRequest, NextResponse } from "next/server";

import { isVoiceLabAdminEmail } from "@/lib/admin-access";
import { createMiddlewareSupabaseClient } from "@/lib/supabase";

const PROTECTED_PATHS = ["/create", "/library", "/account", "/voice-lab"];

function isProtectedPath(pathname: string) {
  return PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export async function proxy(request: NextRequest) {
  const { supabase, response } = createMiddlewareSupabaseClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isProtectedPath(request.nextUrl.pathname) && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (
    user &&
    (request.nextUrl.pathname === "/voice-lab" ||
      request.nextUrl.pathname.startsWith("/voice-lab/")) &&
    !isVoiceLabAdminEmail(user.email)
  ) {
    return NextResponse.redirect(new URL("/account", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/create/:path*", "/library/:path*", "/account/:path*", "/voice-lab/:path*"],
};
