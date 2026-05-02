import { NextRequest } from "next/server";

import { apiError } from "@/lib/api";
import { ensureUserProfile, getRequestUser } from "@/lib/auth";
import { createAudioDownloadRedirect } from "@/lib/audio-download";
import { createAdminSupabaseClient } from "@/lib/supabase";
import {
  getGeneratedAudioPath,
  getGeneratedExportPath,
} from "@/lib/storage";
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
  const { data: generation, error } = await admin
    .from("generations")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!generation || generation.status !== "audio_ready") {
    return apiError("generation_not_ready", "Generation audio is not ready.", 404, response);
  }

  const musicTrackId = normalizeMusicTrackId(generation.music_track_id);

  return createAudioDownloadRedirect({
    speechStoragePath: getGeneratedAudioPath(user.id, generation.id),
    musicTrackId,
    exportStoragePath: getGeneratedExportPath(user.id, generation.id, musicTrackId),
  });
}
