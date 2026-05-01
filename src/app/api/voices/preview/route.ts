import { NextRequest, NextResponse } from "next/server";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { apiError } from "@/lib/api";
import {
  isKnownMeditationVoiceId,
  synthesizeVoicePreview,
} from "@/lib/elevenlabs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const STATIC_PREVIEW_BY_VOICE_ID = new Map([
  ["Mu5jxyqZOLIGltFpfalg", "jameson-guided-meditation.mp3"],
  ["KH1SQLVulwP6uG4O3nmT", "brad-romantic-gentle.mp3"],
  ["zA6D7RyKdc2EClouEMkP", "aimee-tranquil-asmr.mp3"],
  ["pjcYQlDFKMbcOUp6F5GD", "brittney-calm-meditative.mp3"],
]);

export async function GET(request: NextRequest) {
  const voiceId = request.nextUrl.searchParams.get("voiceId")?.trim();

  if (!voiceId || !isKnownMeditationVoiceId(voiceId)) {
    return apiError("invalid_voice", "Unknown voice preview requested.", 400);
  }

  try {
    const staticPreviewFilename = STATIC_PREVIEW_BY_VOICE_ID.get(voiceId);
    if (staticPreviewFilename) {
      const absolutePreviewPath = join(
        process.cwd(),
        "public",
        "voices",
        "preview",
        staticPreviewFilename,
      );
      if (existsSync(absolutePreviewPath)) {
        return new NextResponse(readFileSync(absolutePreviewPath), {
          headers: {
            "Content-Type": "audio/mpeg",
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      }
    }

    const audio = await synthesizeVoicePreview(voiceId);
    return new NextResponse(audio, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "private, max-age=86400",
      },
    });
  } catch (error) {
    console.warn("Failed to synthesize voice preview:", error);
    return apiError(
      "voice_preview_failed",
      "Voice preview is unavailable right now.",
      503,
    );
  }
}
