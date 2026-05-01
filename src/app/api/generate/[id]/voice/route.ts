import { after, NextRequest } from "next/server";

import type { GenerateRequest } from "@/types/api";
import { apiError, apiSuccess, isRecord, readJson } from "@/lib/api";
import { ensureUserProfile, getRequestUser, getUserProfile } from "@/lib/auth";
import { checkGenerationRateLimit, finalizeGenerationAudio } from "@/lib/generation";
import { createAdminSupabaseClient } from "@/lib/supabase";
import {
  getGenerationCreditCost,
  hasEnoughGenerationCredits,
} from "@/lib/credits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

type RegenerateVoiceRequest = {
  voiceId: string;
  musicTrackId: string;
};

function isRegenerateVoiceRequest(value: unknown): value is RegenerateVoiceRequest {
  return (
    isRecord(value) &&
    typeof value.voiceId === "string" &&
    value.voiceId.trim().length > 0 &&
    typeof value.musicTrackId === "string" &&
    value.musicTrackId.trim().length > 0
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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
      "An active subscription is required to generate audio.",
      403,
      response,
    );
  }

  const body = await readJson<unknown>(request);

  if (!isRegenerateVoiceRequest(body)) {
    return apiError("invalid_request", "Invalid voice regeneration payload.", 400, response);
  }

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

  if (!generation) {
    return apiError("generation_not_found", "Generation not found.", 404, response);
  }

  if (!generation.script_text) {
    return apiError("script_not_ready", "The script is not ready yet.", 409, response);
  }

  const rateLimitError = await checkGenerationRateLimit(user.id);
  if (rateLimitError) {
    return apiError(rateLimitError, "Generation rate limit reached.", 429, response);
  }

  const input = generation.prompt_input as GenerateRequest["input"];
  const creditCost = getGenerationCreditCost(input);
  if (!devBypass && profile && !hasEnoughGenerationCredits(profile, creditCost)) {
    return apiError(
      "generation_credits_exhausted",
      "Not enough generation credits remaining to regenerate this voice.",
      402,
      response,
    );
  }

  const regenerateRequest: GenerateRequest = {
    input,
    voiceId: body.voiceId,
    musicTrackId: body.musicTrackId,
  };

  const { error: updateError } = await admin
    .from("generations")
    .update({
      status: "script_ready",
      voice_id: body.voiceId,
      music_track_id: body.musicTrackId,
      audio_url: null,
      error_code: null,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (updateError) {
    throw updateError;
  }

  after(async () => {
    await finalizeGenerationAudio(
      user.id,
      id,
      regenerateRequest,
      generation.script_text!,
    );
  });

  return apiSuccess(
    {
      generationId: id,
      status: "script_ready",
      scriptText: generation.script_text,
    },
    response,
  );
}
