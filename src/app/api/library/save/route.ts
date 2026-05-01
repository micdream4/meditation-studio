import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";

import type { SaveTrackRequest } from "@/types/api";
import { apiError, apiSuccess, isRecord, readJson } from "@/lib/api";
import { ensureUserProfile, getRequestUser } from "@/lib/auth";
import { createAdminSupabaseClient } from "@/lib/supabase";
import {
  AUDIO_BUCKET,
  getGeneratedAudioPath,
  getSavedTrackPath,
  getStorageUrl,
} from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isSaveTrackRequest(value: unknown): value is SaveTrackRequest {
  return (
    isRecord(value) &&
    typeof value.generationId === "string" &&
    value.generationId.length > 0 &&
    typeof value.title === "string" &&
    value.title.trim().length > 0
  );
}

export async function POST(request: NextRequest) {
  const { user, response } = await getRequestUser(request);

  if (!user) {
    return apiError("unauthorized", "You must be logged in.", 401, response);
  }

  await ensureUserProfile(user.id, user.email ?? null);

  const body = await readJson<unknown>(request);
  if (!isSaveTrackRequest(body)) {
    return apiError("invalid_request", "Invalid save payload.", 400, response);
  }

  const admin = createAdminSupabaseClient();
  const [{ count, error: countError }, { data: generation, error: generationError }] =
    await Promise.all([
      admin
        .from("saved_tracks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id),
      admin
        .from("generations")
        .select("*")
        .eq("id", body.generationId)
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

  if (countError ?? generationError) {
    throw countError ?? generationError;
  }

  if ((count ?? 0) >= 20) {
    return apiError("library_limit_reached", "You can only save up to 20 tracks.", 409, response);
  }

  if (!generation || generation.status !== "audio_ready") {
    return apiError("generation_not_ready", "Generation audio is not ready.", 409, response);
  }

  const trackId = randomUUID();
  const fromPath = getGeneratedAudioPath(user.id, generation.id);
  const toPath = getSavedTrackPath(user.id, trackId);

  const { error: copyError } = await admin.storage
    .from(AUDIO_BUCKET)
    .copy(fromPath, toPath);

  if (copyError) {
    return apiError("storage_copy_failed", copyError.message, 500, response);
  }

  const { error: insertError } = await admin.from("saved_tracks").insert({
    id: trackId,
    user_id: user.id,
    generation_id: generation.id,
    title: body.title.trim(),
    storage_path: toPath,
    duration_seconds: generation.duration_minutes * 60,
  });

  if (insertError) {
    await admin.storage.from(AUDIO_BUCKET).remove([toPath]);
    throw insertError;
  }

  return apiSuccess(
    {
      trackId,
      storageUrl: getStorageUrl(toPath),
    },
    response,
  );
}
