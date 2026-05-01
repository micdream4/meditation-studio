import { after, NextRequest } from "next/server";

import type { GenerateRequest } from "@/types/api";
import { apiError, apiSuccess, isRecord, readJson } from "@/lib/api";
import { ensureUserProfile, getRequestUser, getUserProfile } from "@/lib/auth";
import {
  checkGenerationRateLimit,
  createQueuedGeneration,
  finalizeGenerationAudio,
  processGeneration,
} from "@/lib/generation";
import {
  getGenerationCreditCost,
  hasEnoughGenerationCredits,
} from "@/lib/credits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const VALID_MOODS = new Set([
  "anxious",
  "tired",
  "sleepless",
  "unfocused",
  "low",
  "other",
]);

const VALID_THEMES = new Set([
  "breathing",
  "body-scan",
  "loving-kindness",
  "sleep-wind-down",
  "anxiety-release",
  "focus-reset",
  "morning-reset",
  "emotional-soothing",
]);

function isOptionalString(value: unknown) {
  return value === undefined || typeof value === "string";
}

function isGenerateRequest(value: unknown): value is GenerateRequest {
  if (!isRecord(value) || !isRecord(value.input)) {
    return false;
  }

  if (
    typeof value.voiceId !== "string" ||
    value.voiceId.trim().length === 0 ||
    typeof value.musicTrackId !== "string" ||
    value.musicTrackId.trim().length === 0
  ) {
    return false;
  }

  const input = value.input;

  if (
    input.durationMinutes !== 1 &&
    input.durationMinutes !== 5 &&
    input.durationMinutes !== 10 &&
    input.durationMinutes !== 15 &&
    input.durationMinutes !== 20
  ) {
    return false;
  }

  switch (input.mode) {
    case "mood":
      return (
        typeof input.mood === "string" &&
        VALID_MOODS.has(input.mood) &&
        isOptionalString(input.moodDetail) &&
        isOptionalString(input.focus)
      );
    case "template":
      return (
        typeof input.theme === "string" &&
        VALID_THEMES.has(input.theme) &&
        (input.speechRate === undefined ||
          input.speechRate === "slow" ||
          input.speechRate === "normal" ||
          input.speechRate === "fast") &&
        isOptionalString(input.voiceId)
      );
    case "custom":
      return (
        typeof input.text === "string" &&
        input.text.trim().length > 0 &&
        isOptionalString(input.voiceId)
      );
    default:
      return false;
  }
}

export async function POST(request: NextRequest) {
  const { user, response } = await getRequestUser(request);

  if (!user) {
    return apiError("unauthorized", "You must be logged in.", 401, response);
  }

  await ensureUserProfile(user.id, user.email ?? null);
  const profile = await getUserProfile(user.id);
  const body = await readJson<unknown>(request);
  if (!isGenerateRequest(body)) {
    return apiError("invalid_request", "Invalid generation payload.", 400, response);
  }

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

  const creditCost = getGenerationCreditCost(body.input);
  if (!devBypass && profile && !hasEnoughGenerationCredits(profile, creditCost)) {
    return apiError(
      "generation_credits_exhausted",
      "Not enough generation credits remaining for this session.",
      402,
      response,
    );
  }

  const rateLimitError = await checkGenerationRateLimit(user.id);
  if (rateLimitError) {
    return apiError(rateLimitError, "Generation rate limit reached.", 429, response);
  }

  const created = await createQueuedGeneration(user.id, body);
  if (!created.ok) {
    return apiError(created.errorCode, "Invalid generation request.", 400, response);
  }

  const result = await processGeneration(user.id, created.generation.id, body);

  if (result.status === "script_ready" && result.scriptText) {
    after(async () => {
      await finalizeGenerationAudio(
        user.id,
        created.generation.id,
        body,
        result.scriptText!,
      );
    });
  }

  return apiSuccess(result, response);
}
