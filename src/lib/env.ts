const REQUIRED_SERVER_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "STRIPE_SECRET_KEY",
  "OPENROUTER_API_KEY",
  "ELEVENLABS_API_KEY",
] as const;

type RequiredServerEnvKey = (typeof REQUIRED_SERVER_ENV)[number];

function readEnv(key: string): string | undefined {
  const value = process.env[key];
  return value && value.trim().length > 0 ? value : undefined;
}

export function getRequiredEnv(key: RequiredServerEnvKey | string): string {
  const value = readEnv(key);

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

export function getOptionalEnv(key: string, fallback?: string): string | undefined {
  return readEnv(key) ?? fallback;
}

export function getAppBaseUrl(): string {
  return getOptionalEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000")!;
}

export function assertServerEnv(): void {
  for (const key of REQUIRED_SERVER_ENV) {
    getRequiredEnv(key);
  }
}
