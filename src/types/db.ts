/**
 * Database types — mirrors Supabase table schemas.
 * Backend owns these; frontend uses them read-only.
 */

export type DbUser = {
  id: string
  email: string
  display_name: string | null
  subscription_status: 'active' | 'inactive' | 'past_due' | 'canceled'
  subscription_plan: 'monthly' | 'yearly' | null
  subscription_end: string | null
  generation_credits_used: number
  voice_clone_credits_used: number
  stripe_customer_id: string | null // legacy Stripe field; retained for existing databases
  creem_customer_id: string | null
  creem_subscription_id: string | null
  created_at: string
}

export type DbGeneration = {
  id: string
  user_id: string
  mode: 'mood' | 'template' | 'custom'
  prompt_input: Record<string, unknown>
  script_text: string | null
  duration_minutes: 1 | 5 | 10 | 15 | 20
  voice_id: string
  music_track_id: string
  status: 'queued' | 'script_ready' | 'audio_ready' | 'failed'
  audio_url: string | null
  error_code: string | null
  created_at: string
}

export type DbSavedTrack = {
  id: string
  user_id: string
  generation_id: string
  title: string
  storage_path: string
  duration_seconds: number
  created_at: string
}

export type DbCuratedTrack = {
  id: string
  title: string
  slug: string
  full_audio_path: string
  preview_audio_path: string
  transcript_path: string | null
  duration_seconds: number
  sort_order: number
}
