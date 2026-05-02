import { NextRequest } from "next/server";

import { apiError, isRecord, readJson } from "@/lib/api";
import { ensureUserProfile, getRequestUser, getUserProfile } from "@/lib/auth";
import { synthesizeVoiceLabSample } from "@/lib/elevenlabs";
import {
  DEFAULT_VOICE_LAB_SAMPLE_TEXT,
  getVoiceLabPreset,
  type VoiceLabPresetId,
} from "@/lib/voice-lab";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

type VoiceLabSampleRequest = {
  voiceId: string;
  presetId: VoiceLabPresetId;
  text?: string;
};

function isVoiceLabSampleRequest(value: unknown): value is VoiceLabSampleRequest {
  return (
    isRecord(value) &&
    typeof value.voiceId === "string" &&
    value.voiceId.trim().length > 0 &&
    typeof value.presetId === "string" &&
    Boolean(getVoiceLabPreset(value.presetId)) &&
    (typeof value.text === "undefined" || typeof value.text === "string")
  );
}

function normalizeSampleText(text: string | undefined) {
  const normalized = (text ?? DEFAULT_VOICE_LAB_SAMPLE_TEXT)
    .replace(/\s+/g, " ")
    .trim();

  return normalized.slice(0, 500);
}

export async function POST(request: NextRequest) {
  const { user, response } = await getRequestUser(request);

  if (!user) {
    return apiError("unauthorized", "You must be logged in.", 401, response);
  }

  await ensureUserProfile(user.id, user.email ?? null);
  const profile = await getUserProfile(user.id);
  const devBypass =
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_DEV_BYPASS_SUBSCRIPTION === "true";

  if (!devBypass && (!profile || profile.subscription_status !== "active")) {
    return apiError(
      "subscription_required",
      "An active subscription is required to use Voice Lab.",
      403,
      response,
    );
  }

  const body = await readJson<unknown>(request);
  if (!isVoiceLabSampleRequest(body)) {
    return apiError("invalid_request", "Invalid voice lab sample request.", 400, response);
  }

  const sampleText = normalizeSampleText(body.text);
  if (sampleText.length < 20) {
    return apiError("invalid_text", "Sample text is too short.", 400, response);
  }

  const audio = await synthesizeVoiceLabSample({
    voiceId: body.voiceId.trim(),
    presetId: body.presetId,
    text: sampleText,
  });

  return new Response(audio, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}
