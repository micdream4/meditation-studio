import { NextRequest } from "next/server";

import { apiError, apiSuccess } from "@/lib/api";
import { ensureUserProfile, getRequestUser } from "@/lib/auth";
import { mapGenerationRowToResponse } from "@/lib/generation";
import { createAdminSupabaseClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, response } = await getRequestUser(request);

  if (!user) {
    return apiError("unauthorized", "You must be logged in.", 401, response);
  }

  await ensureUserProfile(user.id, user.email ?? null);
  const { id } = await params;
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("generations")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return apiError("generation_not_found", "Generation not found.", 404, response);
  }

  return apiSuccess(mapGenerationRowToResponse(data), response);
}
