import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { Readable } from "node:stream";
import { buffer as streamToBuffer } from "node:stream/consumers";
import { ElevenLabsClient } from "elevenlabs";

import { loadLocalEnv } from "./env-utils.ts";

loadLocalEnv();

const OUTPUT_BY_VOICE_ID = new Map([
  ["Mu5jxyqZOLIGltFpfalg", "public/voices/preview/jameson-guided-meditation.mp3"],
  ["KH1SQLVulwP6uG4O3nmT", "public/voices/preview/brad-romantic-gentle.mp3"],
  ["zA6D7RyKdc2EClouEMkP", "public/voices/preview/aimee-tranquil-asmr.mp3"],
  ["pjcYQlDFKMbcOUp6F5GD", "public/voices/preview/brittney-calm-meditative.mp3"],
]);

const PREVIEW_TEXT =
  "Take a slow breath in. And gently let it go. Allow your attention to settle here.";

async function synthesizePreview(client: ElevenLabsClient, voiceId: string) {
  const audioStream = await client.textToSpeech.convert(voiceId, {
    text: PREVIEW_TEXT,
    model_id: process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2",
    output_format: "mp3_44100_128",
    voice_settings: {
      stability: 0.78,
      similarity_boost: 0.78,
      speed: 0.82,
    },
  });

  return Buffer.from(await streamToBuffer(audioStream as Readable));
}

async function main() {
  if (!process.env.ELEVENLABS_API_KEY) {
    throw new Error("Missing ELEVENLABS_API_KEY.");
  }

  const client = new ElevenLabsClient({
    apiKey: process.env.ELEVENLABS_API_KEY,
  });

  for (const [voiceId, outputPath] of OUTPUT_BY_VOICE_ID) {
    const absoluteOutputPath = resolve(process.cwd(), outputPath);
    mkdirSync(dirname(absoluteOutputPath), { recursive: true });
    const audio = await synthesizePreview(client, voiceId);
    writeFileSync(absoluteOutputPath, audio);
    console.log(`generated ${outputPath}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
