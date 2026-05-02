import { NextRequest } from "next/server";

import { apiError } from "@/lib/api";
import { ensureUserProfile, getRequestUser } from "@/lib/auth";
import { createAudioDownloadRedirect } from "@/lib/audio-download";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getSavedTrackExportPath } from "@/lib/storage";
import { normalizeMusicTrackId } from "@/lib/music";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

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
  const { data: track, error: trackError } = await admin
    .from("saved_tracks")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (trackError) {
    throw trackError;
  }

  if (!track) {
    return apiError("track_not_found", "Track not found.", 404, response);
  }

  const { data: generation, error: generationError } = await admin
    .from("generations")
    .select("music_track_id")
    .eq("id", track.generation_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (generationError) {
    throw generationError;
  }

  const musicTrackId = normalizeMusicTrackId(generation?.music_track_id);

  return createAudioDownloadRedirect({
    speechStoragePath: track.storage_path,
    musicTrackId,
    exportStoragePath: getSavedTrackExportPath(user.id, track.id, musicTrackId),
  });
}
