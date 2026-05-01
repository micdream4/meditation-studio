import { randomUUID } from "node:crypto";

import type {
  GenerationDurationMinutes,
  GenerateRequest,
  GenerationStatus,
  GenerateResponse,
  MoodInput,
  TemplateInput,
} from "@/types/api";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { synthesizeSpeechSegments } from "@/lib/elevenlabs";
import {
  generateMeditationScript,
  getSafetyBlockMessage,
} from "@/lib/openrouter";
import { getGeneratedAudioPath, AUDIO_BUCKET, getStorageUrl } from "@/lib/storage";
import { consumeGenerationCredits, getGenerationCreditCost } from "@/lib/credits";

function durationSeconds(minutes: GenerationDurationMinutes) {
  return minutes * 60;
}

function validateGenerateRequest(input: GenerateRequest["input"]) {
  if (input.durationMinutes !== 1 && input.durationMinutes !== 5 && input.durationMinutes !== 10 && input.durationMinutes !== 15 && input.durationMinutes !== 20) {
    return "invalid_duration";
  }

  if (input.mode === "custom") {
    if (input.text.trim().length === 0) {
      return "custom_text_required";
    }

    if (input.text.trim().length > 2000) {
      return "custom_text_too_long";
    }
  }

  if (input.mode === "template" && input.speechRate && !["slow", "normal", "fast"].includes(input.speechRate)) {
    return "invalid_speech_rate";
  }

  return null;
}

export async function checkGenerationRateLimit(userId: string) {
  const admin = createAdminSupabaseClient();
  const minuteAgo = new Date(Date.now() - 60_000).toISOString();
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [{ count: concurrentCount, error: concurrentError }, { count: minuteCount, error: minuteError }, { count: dailyCount, error: dailyError }] =
    await Promise.all([
      admin
        .from("generations")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .in("status", ["queued", "script_ready"]),
      admin
        .from("generations")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", minuteAgo),
      admin
        .from("generations")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", dayAgo),
    ]);

  if (concurrentError ?? minuteError ?? dailyError) {
    throw concurrentError ?? minuteError ?? dailyError;
  }

  if ((concurrentCount ?? 0) >= 1) {
    return "generation_in_progress";
  }

  if ((minuteCount ?? 0) >= 2) {
    return "rate_limited";
  }

  if ((dailyCount ?? 0) >= 20) {
    return "daily_limit_reached";
  }

  return null;
}

export async function createQueuedGeneration(
  userId: string,
  request: GenerateRequest,
) {
  const admin = createAdminSupabaseClient();
  const validationError = validateGenerateRequest(request.input);

  if (validationError) {
    return {
      ok: false as const,
      errorCode: validationError,
    };
  }

  const { data, error } = await admin
    .from("generations")
    .insert({
      id: randomUUID(),
      user_id: userId,
      mode: request.input.mode,
      prompt_input: request.input,
      duration_minutes: request.input.durationMinutes,
      voice_id: request.voiceId,
      music_track_id: request.musicTrackId,
      status: "queued",
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return { ok: true as const, generation: data };
}

export async function processGeneration(
  userId: string,
  generationId: string,
  request: GenerateRequest,
): Promise<GenerateResponse> {
  const admin = createAdminSupabaseClient();

  try {
    const safetyBlockMessage = getSafetyBlockMessage(request.input);
    if (safetyBlockMessage) {
      const admin = createAdminSupabaseClient();
      await admin
        .from("generations")
        .update({
          script_text: safetyBlockMessage,
          status: "failed",
          error_code: "crisis_input_detected",
        })
        .eq("id", generationId)
        .eq("user_id", userId);

      return {
        generationId,
        status: "failed",
        scriptText: safetyBlockMessage,
        errorCode: "crisis_input_detected",
      };
    }

    const scriptText = await generateMeditationScript(request.input);
    return await markGenerationScriptReady(userId, generationId, scriptText);
  } catch (error) {
    return await markGenerationFailed(admin, userId, generationId, error);
  }
}

export async function markGenerationScriptReady(
  userId: string,
  generationId: string,
  scriptText: string,
): Promise<GenerateResponse> {
  const admin = createAdminSupabaseClient();
  const { error } = await admin
    .from("generations")
    .update({
      script_text: scriptText,
      status: "script_ready",
      error_code: null,
    })
    .eq("id", generationId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  return {
    generationId,
    status: "script_ready",
    scriptText,
  };
}

export async function finalizeGenerationAudio(
  userId: string,
  generationId: string,
  request: GenerateRequest,
  scriptText: string,
): Promise<GenerateResponse> {
  const admin = createAdminSupabaseClient();

  try {
    const audioBuffer = await synthesizeSpeechSegments(
      scriptText,
      request.voiceId,
      request.input.mode === "template" ? request.input.speechRate : "slow",
    );

    const storagePath = getGeneratedAudioPath(userId, generationId);
    const { error: uploadError } = await admin.storage
      .from(AUDIO_BUCKET)
      .upload(storagePath, audioBuffer, {
        contentType: "audio/mpeg",
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    const audioUrl = getStorageUrl(storagePath);
    const { error: updateError } = await admin
      .from("generations")
      .update({
        status: "audio_ready",
        audio_url: audioUrl,
        error_code: null,
      })
      .eq("id", generationId)
      .eq("user_id", userId);

    if (updateError) {
      throw updateError;
    }

    try {
      await consumeGenerationCredits(userId, getGenerationCreditCost(request.input));
    } catch (creditError) {
      console.error("Failed to consume generation credits:", creditError);
    }

    return {
      generationId,
      status: "audio_ready",
      scriptText,
      audioUrl,
    };
  } catch (error) {
    return await markGenerationFailed(admin, userId, generationId, error);
  }
}

async function markGenerationFailed(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  userId: string,
  generationId: string,
  error: unknown,
): Promise<GenerateResponse> {
  const errorCode =
    error instanceof Error ? error.message.slice(0, 100) : "generation_failed";

  await admin
    .from("generations")
    .update({
      status: "failed",
      error_code: errorCode,
    })
    .eq("id", generationId)
    .eq("user_id", userId);

  return {
    generationId,
    status: "failed",
    errorCode,
  };
}

export function mapGenerationRowToResponse(row: {
  id: string;
  status: GenerationStatus;
  script_text: string | null;
  audio_url: string | null;
  error_code: string | null;
}): GenerateResponse {
  return {
    generationId: row.id,
    status: row.status,
    scriptText: row.script_text ?? undefined,
    audioUrl: row.audio_url ?? undefined,
    errorCode: row.error_code ?? undefined,
  };
}

export function getTrackDurationSeconds(input: MoodInput | TemplateInput | GenerateRequest["input"]) {
  return durationSeconds(input.durationMinutes);
}
