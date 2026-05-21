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
      return "90-170 spoken words";
    case 5:
      return "450-650 spoken words";
    case 10:
      return "900-1,200 spoken words";
    case 15:
      return "1,300-1,700 spoken words";
    case 20:
      return "1,700-2,200 spoken words";
    default:
      return "a sparse spoken word count appropriate for the requested duration";
  }
}

function buildPacingInstructions(durationMinutes: number) {
  return [
    `Target length: ${durationMinutes} minutes.`,
    `Target density: ${getTargetWordCount(durationMinutes)} for slow spoken audio with natural silence.`,
    "Write for guided audio, not reading: short and medium sentences, spacious pacing, and one clear idea at a time.",
    "Use [pause] as a standalone line at important settling moments, transitions, and after breath instructions.",
    "Use [pause long] only for sleep or deep settling moments. Use [pause short] when a small beat is enough.",
    "Do not overuse pause markers; silence should support the guidance rather than interrupt every sentence.",
  ].join("\n");
}

const TEMPLATE_GUIDES: Record<string, string[]> = {
  "breathing": [
    "Primary arc: arrive, notice natural breath, gently lengthen the exhale, return to ordinary breathing, close softly.",
    "Keep the breath guidance permissive. Never make breath control feel like a test.",
  ],
  "body-scan": [
    "Primary arc: arrive, feel points of support, scan slowly from face to feet, then widen awareness.",
    "Move through the body in a stable order. Do not jump between unrelated body areas.",
  ],
  "loving-kindness": [
    "Primary arc: settle, offer simple phrases to self, then someone easy to care for, then close without forcing emotion.",
    "Keep the language non-religious, emotionally warm, and not overly sentimental.",
  ],
  "sleep-wind-down": [
    "Primary arc: settle into the bed or resting surface, release the day, soften the body, allow rest without chasing sleep.",
    "Use dim, quiet imagery. Avoid bright, energizing, or achievement-oriented language.",
    "Useful stance: rest is enough; the listener does not need to make sleep happen.",
  ],
  "anxiety-release": [
    "Primary arc: acknowledge activation without dramatizing it, orient to touch and sound, then use breath as a gentle anchor.",
    "Do not say 'calm down' or imply the feeling is irrational. Avoid heavy inward focus too early.",
    "Do not tell the listener they are safe as a factual guarantee or that the feeling is 'not a problem'; use present-moment support language instead.",
    "Useful stance: the listener may not feel calm yet, and that is okay.",
  ],
  "focus-reset": [
    "Primary arc: clear mental residue, align posture and breath, gather attention around one next task, end with readiness.",
    "Keep the cadence clean and less sleepy than a sleep meditation. Avoid spiritual abstraction.",
  ],
  "morning-reset": [
    "Primary arc: wake the body gently, feel breath and posture, set a simple tone for the day, close with quiet readiness.",
    "Sound steady and fresh, not overly motivational.",
  ],
  "emotional-soothing": [
    "Primary arc: name the presence of emotion softly, find support in the body, make room for the feeling, close with care.",
    "Avoid therapy claims, diagnosis, or promises that the feeling will go away.",
  ],
};

const MOOD_GUIDES: Record<string, string[]> = {
  anxious: TEMPLATE_GUIDES["anxiety-release"]!,
  tired: [
    "Primary arc: lower effort, soften the body, let the breath be easy, close with permission to move slowly.",
    "Avoid pushing the listener toward productivity.",
  ],
  sleepless: TEMPLATE_GUIDES["sleep-wind-down"]!,
  unfocused: TEMPLATE_GUIDES["focus-reset"]!,
  low: [
    "Primary arc: gentle arrival, contact with support, one small sense of steadiness, close without forced positivity.",
    "Avoid cheerleading, toxic positivity, or claims that mood will be fixed.",
  ],
  other: [
    "Primary arc: use the user's context, choose one simple thread, and keep the guidance emotionally safe.",
    "Avoid trying to solve the user's whole situation.",
  ],
};

function buildScenarioInstructions(input: GenerateRequest["input"]) {
  if (input.mode === "template") {
    return TEMPLATE_GUIDES[input.theme]?.join("\n") ?? "";
  }

  if (input.mode === "mood") {
    return MOOD_GUIDES[input.mood]?.join("\n") ?? "";
  }

  return [
    "Preserve the user's core intent, but rewrite it as natural spoken meditation guidance.",
    "Remove instructional framing, headings, bullets, and anything that sounds like notes to a narrator.",
  ].join("\n");
}

function buildOutputContract() {
  return [
    "Output only the final meditation script.",
    "No title, no headings, no markdown, no bullets, no narrator notes, and no explanatory intro.",
    "Use second person. Keep the tone grounded, warm, and emotionally safe.",
    "Avoid medical advice, diagnosis, treatment claims, factual safety guarantees, religious specificity, and self-help hype.",
    "End with a soft closing that lands gently.",
  ].join("\n");
}

function buildPrompt(input: GenerateRequest["input"]) {
  switch (input.mode) {
    case "mood":
      return [
        `Create an English meditation script for a user who feels ${input.mood}.`,
        input.moodDetail ? `Extra context: ${input.moodDetail}` : null,
        input.focus ? `Focus topic: ${input.focus}` : null,
        buildScenarioInstructions(input),
        buildPacingInstructions(input.durationMinutes),
        buildOutputContract(),
      ]
        .filter(Boolean)
        .join("\n");
    case "template":
      return [
        `Create an English meditation script using the "${input.theme}" template.`,
        buildScenarioInstructions(input),
        buildPacingInstructions(input.durationMinutes),
        input.speechRate ? `Preferred pacing: ${input.speechRate}.` : null,
        buildOutputContract(),
      ]
        .filter(Boolean)
        .join("\n");
    case "custom":
      return [
        "Rewrite the following into a calm, guided English meditation script.",
        buildScenarioInstructions(input),
        buildPacingInstructions(input.durationMinutes),
        buildOutputContract(),
        `Source text:\n${input.text}`,
      ].join("\n\n");
  }
}

function getGenerationTemperature(input: GenerateRequest["input"]) {
  if (input.mode === "custom") return 0.58;
  if (input.mode === "template" && (input.theme === "sleep-wind-down" || input.theme === "anxiety-release")) {
    return 0.48;
  }
  if (input.mode === "mood" && (input.mood === "sleepless" || input.mood === "anxious" || input.mood === "low")) {
    return 0.48;
  }
  return 0.55;
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
        temperature: getGenerationTemperature(input),
        messages: [
          {
            role: "system",
            content:
              "You are a meditation script writer for slow, studio-style spoken audio and text-to-speech delivery. Write natural calming English that sounds like a human guide with warmth, restraint, and spacious timing. Use second person. Prefer short, breathable sentences. Do not sound like therapy, diagnosis, coaching, preaching, or self-help hype. Do not make medical or psychological claims. Use [pause] markers only as timing instructions; never explain them.",
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
