import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase";
import { getSafeInternalPath } from "@/lib/urls";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectTo = getSafeInternalPath(searchParams.get("redirectTo"), "/create");

  if (code) {
    const { supabase, response } = createRouteHandlerSupabaseClient(request);
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
    }

    const redirectResponse = NextResponse.redirect(`${origin}${redirectTo}`);
    // Copy cookies from supabase response
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
