import { apiSuccess } from "@/lib/api";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { resolveAssetUrl } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("curated_tracks")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    throw error;
  }

  return apiSuccess({
    tracks: data.map((track) => ({
      id: track.id,
      title: track.title,
      slug: track.slug,
      durationSeconds: track.duration_seconds,
      fullAudioUrl: resolveAssetUrl(track.full_audio_path),
      previewAudioUrl: resolveAssetUrl(track.preview_audio_path),
      sortOrder: track.sort_order,
    })),
  });
}
