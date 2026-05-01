import { NextRequest } from "next/server";

import { apiError, apiSuccess } from "@/lib/api";
import { ensureUserProfile, getRequestUser } from "@/lib/auth";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { AUDIO_BUCKET } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
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
    .from("saved_tracks")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return apiError("track_not_found", "Track not found.", 404, response);
  }

  const { error: deleteError } = await admin
    .from("saved_tracks")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (deleteError) {
    throw deleteError;
  }

  const { error: storageError } = await admin.storage
    .from(AUDIO_BUCKET)
    .remove([data.storage_path]);

  if (storageError) {
    console.error("Failed to remove saved track asset", {
      trackId: id,
      storagePath: data.storage_path,
      error: storageError.message,
    });
  }

  return apiSuccess({ deleted: true }, response);
}
