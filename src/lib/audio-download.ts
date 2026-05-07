import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

import { mixMeditationAudioToWav } from "@/lib/audio-export";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { AUDIO_BUCKET } from "@/lib/storage";
import { getMusicTrack } from "@/lib/music";

type DownloadPayload = {
  bytes: Buffer;
  contentType: string;
};

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

function buildAttachmentResponse(
  payload: DownloadPayload,
  filename: string,
) {
  const safeFilename = filename
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120) || "meditation-audio";

  return new NextResponse(new Uint8Array(payload.bytes), {
    headers: {
      "Content-Type": payload.contentType,
      "Content-Length": String(payload.bytes.byteLength),
      "Content-Disposition": `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodeURIComponent(safeFilename)}`,
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
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
  filename,
}: {
  speechStoragePath: string;
  musicTrackId: string;
  exportStoragePath: string;
  filename: string;
}) {
  const payload = await createAudioDownloadPayload({
    speechStoragePath,
    musicTrackId,
    exportStoragePath,
  });

  return buildAttachmentResponse(payload, filename);
}

export async function createAudioDownloadPayload({
  speechStoragePath,
  musicTrackId,
  exportStoragePath,
}: {
  speechStoragePath: string;
  musicTrackId: string;
  exportStoragePath: string;
}): Promise<DownloadPayload> {
  const musicTrack = getMusicTrack(musicTrackId);

  if (!musicTrack.url && !musicTrack.exportUrl) {
    return {
      bytes: Buffer.from(await downloadStorageBytes(speechStoragePath)),
      contentType: "audio/mpeg",
    };
  }

  if (await storageObjectExists(exportStoragePath)) {
    return {
      bytes: Buffer.from(await downloadStorageBytes(exportStoragePath)),
      contentType: "audio/wav",
    };
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

  return {
    bytes: Buffer.from(wavBuffer),
    contentType: "audio/wav",
  };
}
