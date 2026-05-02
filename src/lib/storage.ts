import { getRequiredEnv } from "@/lib/env";

export const AUDIO_BUCKET = "audio-assets";

export function getGeneratedAudioPath(userId: string, generationId: string) {
  return `generated/${userId}/${generationId}.mp3`;
}

export function getSavedTrackPath(userId: string, trackId: string) {
  return `saved/${userId}/${trackId}.mp3`;
}

export function getGeneratedExportPath(userId: string, generationId: string, musicTrackId: string) {
  return `exports/generated/${userId}/${generationId}-${musicTrackId}.wav`;
}

export function getSavedTrackExportPath(userId: string, trackId: string, musicTrackId: string) {
  return `exports/saved/${userId}/${trackId}-${musicTrackId}.wav`;
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
