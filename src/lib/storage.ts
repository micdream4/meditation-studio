import { getRequiredEnv } from "@/lib/env";

export const AUDIO_BUCKET = "audio-assets";

export function getGeneratedAudioPath(userId: string, generationId: string) {
  return `generated/${userId}/${generationId}.mp3`;
}

export function getSavedTrackPath(userId: string, trackId: string) {
  return `saved/${userId}/${trackId}.mp3`;
}

export function getStorageUrl(path: string) {
  const supabaseUrl = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  return `${supabaseUrl}/storage/v1/object/public/${AUDIO_BUCKET}/${path}`;
}

export function resolveAssetUrl(path: string) {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  if (path.startsWith("/")) {
    return path;
  }

  return getStorageUrl(path);
}
