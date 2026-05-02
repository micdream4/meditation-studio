import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

import { mixMeditationAudioToWav } from "@/lib/audio-export";
import { createAdminSupabaseClient } from "@/lib/supabase";
import {
  AUDIO_BUCKET,
  getStorageUrl,
} from "@/lib/storage";
import { getMusicTrack } from "@/lib/music";

function getPublicMusicAssetPath(url: string) {
  if (!url.startsWith("/music/") || url.includes("..")) {
    throw new Error("Invalid music asset path.");
  }

  return path.join(process.cwd(), "public", url);
}

async function downloadStorageBytes(storagePath: string) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.storage
    .from(AUDIO_BUCKET)
    .download(storagePath);

  if (error || !data) {
    throw error ?? new Error("Storage download failed.");
  }

  return new Uint8Array(await data.arrayBuffer());
}

async function storageObjectExists(storagePath: string) {
  const admin = createAdminSupabaseClient();
  const folder = path.posix.dirname(storagePath);
  const filename = path.posix.basename(storagePath);
  const { data, error } = await admin.storage
    .from(AUDIO_BUCKET)
    .list(folder, {
      limit: 1,
      search: filename,
    });

  return !error && Boolean(data?.some((item) => item.name === filename));
}

export async function createAudioDownloadRedirect({
  speechStoragePath,
  musicTrackId,
  exportStoragePath,
}: {
  speechStoragePath: string;
  musicTrackId: string;
  exportStoragePath: string;
}) {
  const musicTrack = getMusicTrack(musicTrackId);

  if (!musicTrack.url && !musicTrack.exportUrl) {
    return NextResponse.redirect(getStorageUrl(speechStoragePath), 303);
  }

  if (await storageObjectExists(exportStoragePath)) {
    return NextResponse.redirect(getStorageUrl(exportStoragePath), 303);
  }

  const [speechBytes, musicBytes] = await Promise.all([
    downloadStorageBytes(speechStoragePath),
    readFile(getPublicMusicAssetPath(musicTrack.exportUrl ?? musicTrack.url!)),
  ]);
  const wavBuffer = await mixMeditationAudioToWav({
    speechBytes,
    musicBytes: new Uint8Array(musicBytes),
  });
  const admin = createAdminSupabaseClient();
  const { error } = await admin.storage
    .from(AUDIO_BUCKET)
    .upload(exportStoragePath, wavBuffer, {
      contentType: "audio/wav",
      upsert: true,
    });

  if (error) {
    throw error;
  }

  return NextResponse.redirect(getStorageUrl(exportStoragePath), 303);
}
