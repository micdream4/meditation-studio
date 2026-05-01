import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(filename: string) {
  const filePath = resolve(process.cwd(), filename);
  if (!existsSync(filePath)) {
    return;
  }

  const content = readFileSync(filePath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    if (!key || process.env[key]) {
      continue;
    }

    let value = line.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const requiredEnv = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "OPENROUTER_API_KEY",
  "OPENROUTER_MODEL",
  "ELEVENLABS_API_KEY",
  "ELEVENLABS_MODEL_ID",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_MONTHLY_PRICE_ID",
  "STRIPE_YEARLY_PRICE_ID",
] as const;

const optionalVoiceEnv = [
  "NEXT_PUBLIC_VOICE_EN_1_ID",
  "NEXT_PUBLIC_VOICE_EN_2_ID",
  "NEXT_PUBLIC_VOICE_ZH_1_ID",
  "NEXT_PUBLIC_VOICE_ZH_2_ID",
] as const;

const missing = requiredEnv.filter((key) => {
  const value = process.env[key];
  return !value || value.trim().length === 0;
});

if (missing.length > 0) {
  console.error("Missing required environment variables:");
  for (const key of missing) {
    console.error(`- ${key}`);
  }
  process.exit(1);
}

const configuredVoices = optionalVoiceEnv.filter((key) => {
  const value = process.env[key];
  return Boolean(value && value.trim().length > 0);
});

if (configuredVoices.length === 0) {
  console.warn(
    "No preset voice IDs configured. /api/voices will fall back to ElevenLabs voice listing.",
  );
}

console.log("Environment variables look valid.");
