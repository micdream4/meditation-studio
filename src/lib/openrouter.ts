import OpenAI from "openai";

import type { GenerateRequest } from "@/types/api";
import { getOptionalEnv, getRequiredEnv } from "@/lib/env";

let openRouterClient: OpenAI | null = null;
const DEFAULT_OPENROUTER_MODEL = "qwen/qwen3.6-flash";
const FALLBACK_OPENROUTER_MODELS = [
  "~openai/gpt-mini-latest",
  "openrouter/auto",
] as const;
const CRISIS_SUPPORT_MESSAGE = [
  "It sounds like you may be dealing with something more urgent than a meditation session can safely support.",
  "If you might hurt yourself or someone else, contact local emergency services now.",
  "If you are in the United States or Canada, call or text 988 for immediate crisis support.",
  "If you are elsewhere, contact your local crisis hotline or a trusted medical professional right away.",
].join(" ");

function getOpenRouterClient() {
  if (!openRouterClient) {
    openRouterClient = new OpenAI({
      apiKey: getRequiredEnv("OPENROUTER_API_KEY"),
      baseURL: "https://openrouter.ai/api/v1",
    });
  }

  return openRouterClient;
}

function getCandidateModels() {
  const configuredModel = getOptionalEnv(
    "OPENROUTER_MODEL",
    DEFAULT_OPENROUTER_MODEL,
  )!;

  return [configuredModel, DEFAULT_OPENROUTER_MODEL, ...FALLBACK_OPENROUTER_MODELS]
    .map((model) => model.trim())
    .filter(Boolean)
    .filter((model, index, list) => list.indexOf(model) === index);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "OpenRouter request failed.";
}

function shouldRetryWithFallback(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("not available in your region") ||
    message.includes("no route found") ||
    message.includes("provider returned error") ||
    message.includes("rate limit") ||
    message.includes("temporarily unavailable") ||
    message.includes("timed out") ||
    message.includes("timeout")
  );
}

function getTargetWordCount(durationMinutes: number) {
  switch (durationMinutes) {
    case 1:
      return "90-110 spoken words";
    case 5:
      return "420-560 spoken words";
    case 10:
      return "850-1,050 spoken words";
    case 15:
      return "1,250-1,550 spoken words";
    case 20:
      return "1,650-2,050 spoken words";
    default:
      return "a sparse spoken word count appropriate for the requested duration";
  }
}

function buildPacingInstructions(durationMinutes: number) {
  return [
    `Target length: ${durationMinutes} minutes.`,
    `Target density: ${getTargetWordCount(durationMinutes)} because the final TTS will be spoken slowly.`,
    "Write for guided audio, not reading: short lines, simple sentences, spacious pacing.",
    "Use [pause] as a standalone line after most breath or body-awareness instructions.",
    "Do not pack the script with continuous prose; silence is part of the meditation.",
  ].join("\n");
}

function buildPrompt(input: GenerateRequest["input"]) {
  switch (input.mode) {
    case "mood":
      return [
        `Create an English meditation script for a user who feels ${input.mood}.`,
        input.moodDetail ? `Extra context: ${input.moodDetail}` : null,
        input.focus ? `Focus topic: ${input.focus}` : null,
        buildPacingInstructions(input.durationMinutes),
      ]
        .filter(Boolean)
        .join("\n");
    case "template":
      return [
        `Create an English meditation script using the "${input.theme}" template.`,
        buildPacingInstructions(input.durationMinutes),
        input.speechRate ? `Preferred pacing: ${input.speechRate}.` : null,
      ]
        .filter(Boolean)
        .join("\n");
    case "custom":
      return [
        "Rewrite the following into a calm, guided English meditation script.",
        buildPacingInstructions(input.durationMinutes),
        `Source text:\n${input.text}`,
      ].join("\n\n");
  }
}

const CRISIS_PATTERNS = [
  /\bkill myself\b/i,
  /\bsuicid(?:e|al)\b/i,
  /\bself[- ]harm\b/i,
  /\bhurt myself\b/i,
  /\bend my life\b/i,
  /\bwant to die\b/i,
  /\bcan't go on\b/i,
  /\boverdose\b/i,
  /\bhurt someone\b/i,
  /\bkill someone\b/i,
  /\bviolent thoughts\b/i,
] as const;

export function getSafetyBlockMessage(input: GenerateRequest["input"]) {
  const text = [
    input.mode === "custom" ? input.text : "",
    input.mode === "mood" ? input.moodDetail ?? "" : "",
    input.mode === "mood" ? input.focus ?? "" : "",
    input.mode === "template" ? input.theme : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (CRISIS_PATTERNS.some((pattern) => pattern.test(text))) {
    return CRISIS_SUPPORT_MESSAGE;
  }

  return null;
}

export async function generateMeditationScript(input: GenerateRequest["input"]) {
  const client = getOpenRouterClient();
  const candidateModels = getCandidateModels();
  let lastError: Error | null = null;

  for (const model of candidateModels) {
    try {
      const completion = await client.chat.completions.create({
        model,
        temperature: 0.8,
        messages: [
          {
            role: "system",
            content:
              "You are a meditation writer for slow spoken audio. Produce a calm, grounded English meditation script. Use second person, avoid medical advice, avoid diagnosis, avoid religious specificity, and keep the tone gentle and unforced. Favor sparse wording, breath-length phrases, and meaningful silence. Use [pause] markers only as timing instructions; never explain them.",
          },
          {
            role: "user",
            content: buildPrompt(input),
          },
        ],
      });

      const content = completion.choices[0]?.message?.content?.trim();
      if (content) {
        return content;
      }

      lastError = new Error(`OpenRouter model "${model}" returned empty content.`);
    } catch (error) {
      lastError = new Error(`OpenRouter model "${model}" failed: ${getErrorMessage(error)}`);
      if (!shouldRetryWithFallback(error)) {
        throw lastError;
      }
    }
  }

  throw lastError ?? new Error("OpenRouter request failed.");
}
