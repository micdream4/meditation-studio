import { Readable } from "node:stream";
import { buffer as streamToBuffer } from "node:stream/consumers";
import { ElevenLabsClient } from "elevenlabs";

import type { Voice } from "@/types/api";
import { getOptionalEnv, getRequiredEnv } from "@/lib/env";

let elevenLabsClient: ElevenLabsClient | null = null;

function getElevenLabsClient() {
  if (!elevenLabsClient) {
    elevenLabsClient = new ElevenLabsClient({
      apiKey: getRequiredEnv("ELEVENLABS_API_KEY"),
    });
  }

  return elevenLabsClient;
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
  if (text.includes("asmr")) relevanceScore += 3;
  if (voice.use_case === "narrative_story") relevanceScore += 4;

  if (EXCLUDED_VOICE_TERMS.some((term) => text.includes(term))) {
    relevanceScore -= 12;
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
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return [normalized];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < normalized.length) {
    let end = Math.min(start + maxLength, normalized.length);

    if (end < normalized.length) {
      const boundary = normalized.lastIndexOf(" ", end);
      if (boundary > start + Math.floor(maxLength * 0.6)) {
        end = boundary;
      }
    }

    chunks.push(normalized.slice(start, end).trim());
    start = end;
  }

  return chunks.filter(Boolean);
}

function normalizePauseMarkers(text: string): string {
  // ElevenLabs does not use SSML here, so punctuation is the safest portable pause cue.
  return text
    .replace(/\s*\[pause\]\s*/gi, " ... ... ")
    .replace(/\s+/g, " ")
    .trim();
}

function getMeditationSpeed(speechRate?: "slow" | "normal" | "fast") {
  if (speechRate === "fast") return 0.96;
  if (speechRate === "normal") return 0.86;
  return 0.78;
}

export async function synthesizeSpeechSegments(
  text: string,
  voiceId: string,
  speechRate?: "slow" | "normal" | "fast",
) {
  const chunks = splitTextIntoChunks(normalizePauseMarkers(text));
  const buffers: Buffer[] = [];

  for (const [index, chunk] of chunks.entries()) {
    const audioStream = await getElevenLabsClient().textToSpeech.convert(voiceId, {
      text: chunk,
      model_id: getOptionalEnv("ELEVENLABS_MODEL_ID", "eleven_multilingual_v2")!,
      output_format: "mp3_44100_128",
      previous_text: chunks[index - 1],
      next_text: chunks[index + 1],
      voice_settings: {
        stability: 0.76,
        similarity_boost: 0.8,
        speed: getMeditationSpeed(speechRate),
      },
    });

    buffers.push(Buffer.from(await streamToBuffer(audioStream as Readable)));
  }

  return Buffer.concat(buffers);
}

export async function synthesizeVoicePreview(voiceId: string) {
  const previewText =
    "Take a slow breath in. And gently let it go. Allow your attention to settle here.";
  const audioStream = await getElevenLabsClient().textToSpeech.convert(voiceId, {
    text: previewText,
    model_id: getOptionalEnv("ELEVENLABS_MODEL_ID", "eleven_multilingual_v2")!,
    output_format: "mp3_44100_128",
    voice_settings: {
      stability: 0.78,
      similarity_boost: 0.78,
      speed: 0.82,
    },
  });

  return Buffer.from(await streamToBuffer(audioStream as Readable));
}
