import { NextRequest } from "next/server";

import { apiError, apiSuccess } from "@/lib/api";
import { ensureUserProfile, getRequestUser } from "@/lib/auth";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getStorageUrl } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { user, response } = await getRequestUser(request);

  if (!user) {
    return apiError("unauthorized", "You must be logged in.", 401, response);
  }

  await ensureUserProfile(user.id, user.email ?? null);
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("saved_tracks")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return apiSuccess(
    {
      tracks: data.map((track) => ({
        id: track.id,
        generationId: track.generation_id,
        title: track.title,
        durationSeconds: track.duration_seconds,
        storageUrl: getStorageUrl(track.storage_path),
        createdAt: track.created_at,
      })),
      total: data.length,
    },
    response,
  );
}
