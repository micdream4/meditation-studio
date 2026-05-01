import { getMissingEnv, loadLocalEnv } from "./env-utils.ts";

loadLocalEnv();

const requiredEnv = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "OPENROUTER_API_KEY",
  "OPENROUTER_MODEL",
  "ELEVENLABS_API_KEY",
  "ELEVENLABS_MODEL_ID",
  "CREEM_API_KEY",
  "CREEM_WEBHOOK_SECRET",
] as const;

const requiredCreemProductEnv =
  process.env.CREEM_MODE === "live"
    ? (["CREEM_MONTHLY_PRODUCT_ID", "CREEM_YEARLY_PRODUCT_ID"] as const)
    : (["CREEM_TEST_PRODUCT_ID"] as const);

const requiredBillingEnv = [
  ...requiredEnv,
  ...requiredCreemProductEnv,
] as const;

const optionalVoiceEnv = [
  "NEXT_PUBLIC_VOICE_EN_1_ID",
  "NEXT_PUBLIC_VOICE_EN_2_ID",
  "NEXT_PUBLIC_VOICE_ZH_1_ID",
  "NEXT_PUBLIC_VOICE_ZH_2_ID",
] as const;

const missing = getMissingEnv(requiredBillingEnv);

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
