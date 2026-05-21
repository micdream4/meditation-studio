import { Readable } from "node:stream";
import { buffer as streamToBuffer } from "node:stream/consumers";
import { ElevenLabsClient } from "elevenlabs";

import type { GenerateRequest, Voice } from "@/types/api";
import { getOptionalEnv, getRequiredEnv } from "@/lib/env";
import {
  VOICE_LAB_PRESETS,
  getVoiceLabPreset,
  type VoiceLabPresetId,
  type VoiceLabSettings,
} from "@/lib/voice-lab";

let elevenLabsClient: ElevenLabsClient | null = null;
const ELEVENLABS_MAX_ATTEMPTS = 3;

function getElevenLabsClient() {
  if (!elevenLabsClient) {
    elevenLabsClient = new ElevenLabsClient({
      apiKey: getRequiredEnv("ELEVENLABS_API_KEY"),
    });
  }

  return elevenLabsClient;
}

type TextToSpeechRequest = Parameters<ElevenLabsClient["textToSpeech"]["convert"]>[1];

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRetryableElevenLabsStatus(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return null;
  }

  const statusCode = "statusCode" in error ? Number(error.statusCode) : null;
  return Number.isFinite(statusCode) ? statusCode : null;
}

function shouldRetryElevenLabsError(error: unknown) {
  const statusCode = getRetryableElevenLabsStatus(error);
  if (statusCode && [408, 409, 429, 500, 502, 503, 504].includes(statusCode)) {
    return true;
  }

  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return (
    message.includes("fetch failed") ||
    message.includes("timed out") ||
    message.includes("timeout") ||
    message.includes("temporarily")
  );
}

async function convertTextToSpeechWithRetry(
  voiceId: string,
  request: TextToSpeechRequest,
) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= ELEVENLABS_MAX_ATTEMPTS; attempt++) {
    try {
      return await getElevenLabsClient().textToSpeech.convert(voiceId, request);
    } catch (error) {
      lastError = error;
      if (attempt === ELEVENLABS_MAX_ATTEMPTS || !shouldRetryElevenLabsError(error)) {
        throw error;
      }

      await wait(600 * attempt);
    }
  }

  throw lastError;
}

type VoiceEnvConfig = {
  id?: string;
  name: string;
  previewUrl?: string;
  language: Voice["language"];
};

type SharedVoice = {
  voice_id?: string;
  name?: string;
  preview_url?: string;
  language?: string;
  gender?: string;
  age?: string;
  accent?: string;
  descriptive?: string;
  use_case?: string;
  description?: string;
  cloned_by_count?: number;
};

type SharedVoicesResponse = {
  voices?: SharedVoice[];
};

const MEDITATION_VOICE_SEARCH_TERMS = [
  "meditation",
  "soothing",
  "sleep",
  "relaxing",
  "mindfulness",
] as const;

const EXCLUDED_VOICE_TERMS = [
  "trickster",
  "energetic",
  "quirky",
  "crime",
  "news",
  "advertising",
  "affirmation",
  "manifest",
  "romantic",
] as const;

const STYLE_RISK_VOICE_TERMS = [
  "asmr",
  "sleep",
] as const;

export const CACHED_MEDITATION_LIBRARY_VOICES: Voice[] = [
  {
    id: "Mu5jxyqZOLIGltFpfalg",
    name: "Jameson - Guided Meditation",
    language: "en",
    previewUrl: "/api/voices/preview?voiceId=Mu5jxyqZOLIGltFpfalg",
    description: "Grounded male voice for breathwork and focus",
  },
  {
    id: "KH1SQLVulwP6uG4O3nmT",
    name: "Brad - Romantic & Gentle",
    language: "en",
    previewUrl: "/api/voices/preview?voiceId=KH1SQLVulwP6uG4O3nmT",
    description: "Warm male voice for loving-kindness sessions",
  },
  {
    id: "zA6D7RyKdc2EClouEMkP",
    name: "AImee - Tranquil ASMR",
    language: "en",
    previewUrl: "/api/voices/preview?voiceId=zA6D7RyKdc2EClouEMkP",
    description: "Soft intimate voice for sleep wind-down",
  },
  {
    id: "pjcYQlDFKMbcOUp6F5GD",
    name: "Brittney - Calm & Meditative",
    language: "en",
    previewUrl: "/api/voices/preview?voiceId=pjcYQlDFKMbcOUp6F5GD",
    description: "Clear calm voice for body scans",
  },
];

export function isKnownMeditationVoiceId(voiceId: string) {
  return CACHED_MEDITATION_LIBRARY_VOICES.some((voice) => voice.id === voiceId);
}

function getPresetVoiceConfigs(): VoiceEnvConfig[] {
  return [
    {
      id: getOptionalEnv("NEXT_PUBLIC_VOICE_EN_1_ID"),
      name: getOptionalEnv("NEXT_PUBLIC_VOICE_EN_1_NAME", "Serene English")!,
      previewUrl: getOptionalEnv("NEXT_PUBLIC_VOICE_EN_1_PREVIEW_URL"),
      language: "en",
    },
    {
      id: getOptionalEnv("NEXT_PUBLIC_VOICE_EN_2_ID"),
      name: getOptionalEnv("NEXT_PUBLIC_VOICE_EN_2_NAME", "Warm English")!,
      previewUrl: getOptionalEnv("NEXT_PUBLIC_VOICE_EN_2_PREVIEW_URL"),
      language: "en",
    },
    {
      id: getOptionalEnv("NEXT_PUBLIC_VOICE_ZH_1_ID"),
      name: getOptionalEnv("NEXT_PUBLIC_VOICE_ZH_1_NAME", "Calm Mandarin")!,
      previewUrl: getOptionalEnv("NEXT_PUBLIC_VOICE_ZH_1_PREVIEW_URL"),
      language: "zh",
    },
    {
      id: getOptionalEnv("NEXT_PUBLIC_VOICE_ZH_2_ID"),
      name: getOptionalEnv("NEXT_PUBLIC_VOICE_ZH_2_NAME", "Soft Mandarin")!,
      previewUrl: getOptionalEnv("NEXT_PUBLIC_VOICE_ZH_2_PREVIEW_URL"),
      language: "zh",
    },
  ];
}

function scoreMeditationVoice(voice: SharedVoice) {
  const text = [
    voice.name,
    voice.description,
    voice.descriptive,
    voice.use_case,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  let relevanceScore = 0;

  if (text.includes("meditation") || text.includes("meditative")) relevanceScore += 18;
  if (text.includes("guided")) relevanceScore += 8;
  if (text.includes("sleep")) relevanceScore += 8;
  if (text.includes("mindfulness") || text.includes("mindful")) relevanceScore += 8;
  if (text.includes("relaxation") || text.includes("relaxing")) relevanceScore += 7;
  if (text.includes("soothing")) relevanceScore += 7;
  if (text.includes("calm")) relevanceScore += 5;
  if (text.includes("gentle")) relevanceScore += 5;
  if (text.includes("soft")) relevanceScore += 4;
  if (voice.use_case === "narrative_story") relevanceScore += 4;

  if (EXCLUDED_VOICE_TERMS.some((term) => text.includes(term))) {
    relevanceScore -= 24;
  }

  if (STYLE_RISK_VOICE_TERMS.some((term) => text.includes(term))) {
    relevanceScore -= 4;
  }

  const popularityScore = Math.min(
    Math.log10((voice.cloned_by_count ?? 0) + 1) * 5,
    28,
  );

  return relevanceScore * 1.6 + popularityScore;
}

function normalizeSharedVoiceName(name: string) {
  return name
    .replace(/\s+/g, " ")
    .replace(/\s+-\s+/g, " - ")
    .trim();
}

async function listSharedMeditationVoices(): Promise<Voice[]> {
  const apiKey = getRequiredEnv("ELEVENLABS_API_KEY");
  const seen = new Map<string, SharedVoice>();

  const requests = MEDITATION_VOICE_SEARCH_TERMS.map(async (term) => {
    const url = new URL("https://api.elevenlabs.io/v1/shared-voices");
    url.searchParams.set("search", term);
    url.searchParams.set("language", "en");
    url.searchParams.set("page_size", "12");
    url.searchParams.set("sort", "cloned_by_count");

    const response = await fetch(url, {
      headers: {
        "xi-api-key": apiKey,
      },
      signal: AbortSignal.timeout(3500),
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs shared voice search failed: ${response.status}`);
    }

    return (await response.json()) as SharedVoicesResponse;
  });

  const results = await Promise.allSettled(requests);
  if (results.every((result) => result.status === "rejected")) {
    throw new Error("ElevenLabs shared voice search failed for every search term.");
  }

  for (const result of results) {
    if (result.status !== "fulfilled") {
      continue;
    }

    const body = result.value;
    for (const voice of body.voices ?? []) {
      if (voice.voice_id && voice.name && voice.preview_url) {
        seen.set(voice.voice_id, voice);
      }
    }
  }

  return Array.from(seen.values())
    .map((voice) => ({
      voice,
      score: scoreMeditationVoice(voice),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (b.voice.cloned_by_count ?? 0) - (a.voice.cloned_by_count ?? 0);
    })
    .slice(0, 8)
    .map(({ voice }) => ({
      id: voice.voice_id!,
      name: normalizeSharedVoiceName(voice.name!),
      language: "en",
      previewUrl: voice.preview_url,
      description: voice.description ?? voice.descriptive,
    }));
}

export async function listVoices(): Promise<Voice[]> {
  const configuredVoices = getPresetVoiceConfigs()
    .filter((voice): voice is Required<Pick<VoiceEnvConfig, "id">> & VoiceEnvConfig => Boolean(voice.id))
    .map((voice) => ({
      id: voice.id,
      name: voice.name,
      language: voice.language,
      previewUrl: voice.previewUrl,
    }));

  if (configuredVoices.length > 0) {
    return configuredVoices;
  }

  try {
    const meditationVoices = await listSharedMeditationVoices();
    if (meditationVoices.length > 0) {
      return meditationVoices;
    }
  } catch (error) {
    console.warn("Failed to load shared meditation voices:", error);
  }

  return CACHED_MEDITATION_LIBRARY_VOICES;
}

export function splitTextIntoChunks(text: string, maxLength = 800) {
  const normalized = text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (normalized.length <= maxLength) {
    return [normalized];
  }

  const chunks: string[] = [];
  const blocks = normalized.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);

  function pushChunk(value: string) {
    const chunk = value.trim();
    if (chunk) chunks.push(chunk);
  }

  function splitOversizedBlock(block: string) {
    const sentenceParts = block
      .split(/([.!?]+|\.\.\.\s*\.\.\.\s*\.\.\.)\s+/)
      .reduce<string[]>((parts, part, index, source) => {
        if (!part.trim()) return parts;
        if (index % 2 === 1 && parts.length > 0) {
          parts[parts.length - 1] = `${parts[parts.length - 1]}${part}`;
        } else if (index % 2 === 0) {
          const next = source[index + 1];
          parts.push(next && /^[.!?]+|\.\.\./.test(next) ? part.trim() : part.trim());
        }
        return parts;
      }, [])
      .filter(Boolean);

    let current = "";
    for (const sentence of sentenceParts.length > 0 ? sentenceParts : block.split(/\s+/)) {
      const candidate = current ? `${current} ${sentence}` : sentence;
      if (candidate.length > maxLength && current.length > 0) {
        pushChunk(current);
        current = sentence;
      } else if (candidate.length > maxLength) {
        pushChunk(candidate.slice(0, maxLength));
        current = candidate.slice(maxLength);
      } else {
        current = candidate;
      }
    }
    pushChunk(current);
  }

  let current = "";
  for (const block of blocks) {
    if (block.length > maxLength) {
      pushChunk(current);
      current = "";
      splitOversizedBlock(block);
      continue;
    }

    const candidate = current ? `${current}\n\n${block}` : block;
    if (candidate.length > maxLength) {
      pushChunk(current);
      current = block;
    } else {
      current = candidate;
    }
  }
  pushChunk(current);

  return chunks.filter(Boolean);
}

function normalizePauseMarkers(text: string): string {
  // ElevenLabs does not use SSML here, so punctuation is the safest portable pause cue.
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\s*\[pause short\]\s*/gi, "\n\n... ...\n\n")
    .replace(/\s*\[pause long\]\s*/gi, "\n\n... ... ... ... ...\n\n")
    .replace(/\s*\[pause\]\s*/gi, "\n\n... ... ...\n\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function getMeditationSpeed(speechRate?: "slow" | "normal" | "fast") {
  if (speechRate === "fast") return 0.82;
  if (speechRate === "normal") return 0.72;
  return 0.64;
}

function getProductionVoiceBaseSettings(input?: GenerateRequest["input"]): VoiceLabSettings {
  if (input?.mode === "template") {
    switch (input.theme) {
      case "sleep-wind-down":
      case "body-scan":
        return { ...VOICE_LAB_PRESETS[2]!.settings, speed: 0.62 };
      case "focus-reset":
      case "morning-reset":
        return { ...VOICE_LAB_PRESETS[2]!.settings, speed: 0.7 };
      case "loving-kindness":
      case "emotional-soothing":
        return { ...VOICE_LAB_PRESETS[1]!.settings, style: 0.46, speed: 0.64 };
      case "anxiety-release":
      case "breathing":
        return { ...VOICE_LAB_PRESETS[0]!.settings, stability: 0.5, style: 0.28 };
    }
  }

  if (input?.mode === "mood") {
    switch (input.mood) {
      case "sleepless":
      case "tired":
        return { ...VOICE_LAB_PRESETS[2]!.settings, speed: 0.62 };
      case "unfocused":
        return { ...VOICE_LAB_PRESETS[2]!.settings, speed: 0.7 };
      case "low":
        return { ...VOICE_LAB_PRESETS[0]!.settings, stability: 0.52, style: 0.28 };
      case "anxious":
      case "other":
        return { ...VOICE_LAB_PRESETS[0]!.settings, stability: 0.5, style: 0.28 };
    }
  }

  return VOICE_LAB_PRESETS[0]!.settings;
}

function getMeditationVoiceSettings(input?: GenerateRequest["input"]): VoiceLabSettings {
  const speechRate = input?.mode === "template" ? input.speechRate : undefined;
  const baseSettings = getProductionVoiceBaseSettings(input);
  return {
    ...baseSettings,
    speed: speechRate ? getMeditationSpeed(speechRate) : baseSettings.speed,
  };
}

function getElevenLabsVoiceSettings(settings: VoiceLabSettings) {
  const { speed, ...compatibleSettings } = settings;

  if (getOptionalEnv("ELEVENLABS_ENABLE_SPEED_CONTROL") === "true") {
    return { ...compatibleSettings, speed };
  }

  return compatibleSettings;
}

export async function synthesizeSpeechSegments(
  text: string,
  voiceId: string,
  input?: GenerateRequest["input"],
) {
  const chunks = splitTextIntoChunks(normalizePauseMarkers(text), 1600);
  const buffers: Buffer[] = [];

  for (const [index, chunk] of chunks.entries()) {
    const audioStream = await convertTextToSpeechWithRetry(voiceId, {
      text: chunk,
      model_id: getOptionalEnv("ELEVENLABS_MODEL_ID", "eleven_multilingual_v2")!,
      output_format: "mp3_44100_128",
      previous_text: chunks[index - 1],
      next_text: chunks[index + 1],
      voice_settings: getElevenLabsVoiceSettings(getMeditationVoiceSettings(input)),
    });

    buffers.push(Buffer.from(await streamToBuffer(audioStream as Readable)));
  }

  return Buffer.concat(buffers);
}

export async function synthesizeVoicePreview(voiceId: string) {
  const previewText =
    "Take a slow breath in. And gently let it go. Allow your attention to settle here.";
  const audioStream = await convertTextToSpeechWithRetry(voiceId, {
    text: previewText,
    model_id: getOptionalEnv("ELEVENLABS_MODEL_ID", "eleven_multilingual_v2")!,
    output_format: "mp3_44100_128",
    voice_settings: getElevenLabsVoiceSettings({
      stability: 0.5,
      similarity_boost: 0.7,
      style: 0.35,
      use_speaker_boost: true,
      speed: 0.68,
    }),
  });

  return Buffer.from(await streamToBuffer(audioStream as Readable));
}

export async function synthesizeVoiceLabSample({
  voiceId,
  presetId,
  text,
}: {
  voiceId: string;
  presetId: VoiceLabPresetId;
  text: string;
}) {
  const preset = getVoiceLabPreset(presetId);

  if (!preset) {
    throw new Error("Unknown voice lab preset.");
  }

  const audioStream = await convertTextToSpeechWithRetry(voiceId, {
    text: normalizePauseMarkers(text),
    model_id: getOptionalEnv("ELEVENLABS_MODEL_ID", "eleven_multilingual_v2")!,
    output_format: "mp3_44100_128",
    voice_settings: getElevenLabsVoiceSettings(preset.settings),
  });

  return Buffer.from(await streamToBuffer(audioStream as Readable));
}
