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

  const generationIds = data.map((track) => track.generation_id);
  const { data: generations, error: generationsError } = generationIds.length > 0
    ? await admin
      .from("generations")
      .select("id,music_track_id")
      .eq("user_id", user.id)
      .in("id", generationIds)
    : { data: [], error: null };

  if (generationsError) {
    throw generationsError;
  }

  const musicTrackByGenerationId = new Map(
    (generations ?? []).map((generation) => [
      generation.id,
      generation.music_track_id,
    ]),
  );

  return apiSuccess(
    {
      tracks: data.map((track) => ({
        id: track.id,
        generationId: track.generation_id,
        title: track.title,
        durationSeconds: track.duration_seconds,
        storageUrl: getStorageUrl(track.storage_path),
        musicTrackId: musicTrackByGenerationId.get(track.generation_id) ?? "none",
        createdAt: track.created_at,
      })),
      total: data.length,
    },
    response,
  );
}
