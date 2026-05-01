import { apiSuccess } from "@/lib/api";
import { listVoices } from "@/lib/elevenlabs";
import type { Voice } from "@/types/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  let voices: Voice[] = [];

  try {
    voices = await listVoices();
  } catch (error) {
    console.warn("Failed to load ElevenLabs voices:", error);
  }

  return apiSuccess({ voices });
}
