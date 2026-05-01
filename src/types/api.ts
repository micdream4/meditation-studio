/**
 * API Contract — shared between frontend and backend
 * Neither side should change these types without coordinating with the other.
 */

// ---------------------------------------------------------------------------
// Common
// ---------------------------------------------------------------------------

export type ApiError = {
  code: string
  message: string
}

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: ApiError }

// ---------------------------------------------------------------------------
// Generation
// ---------------------------------------------------------------------------

export type GenerationMode = 'mood' | 'template' | 'custom'
export type GenerationDurationMinutes = 1 | 5 | 10 | 15 | 20

export type MoodInput = {
  mode: 'mood'
  mood: 'anxious' | 'tired' | 'sleepless' | 'unfocused' | 'low' | 'other'
  moodDetail?: string
  durationMinutes: GenerationDurationMinutes
  focus?: string
}

export type TemplateInput = {
  mode: 'template'
  theme:
    | 'breathing'
    | 'body-scan'
    | 'loving-kindness'
    | 'sleep-wind-down'
    | 'anxiety-release'
    | 'focus-reset'
    | 'morning-reset'
    | 'emotional-soothing'
  durationMinutes: GenerationDurationMinutes
  speechRate?: 'slow' | 'normal' | 'fast'
  voiceId?: string
}

export type CustomInput = {
  mode: 'custom'
  text: string // max 2000 chars
  durationMinutes: GenerationDurationMinutes
  voiceId?: string
}

export type GenerateRequest = {
  input: MoodInput | TemplateInput | CustomInput
  voiceId: string
  musicTrackId: string
}

export type GenerationStatus =
  | 'queued'
  | 'script_ready'
  | 'audio_ready'
  | 'failed'

export type GenerateResponse = {
  generationId: string
  status: GenerationStatus
  scriptText?: string
  audioUrl?: string
  errorCode?: string
}

// POST /api/generate
// Request body: GenerateRequest
// Response: ApiResponse<GenerateResponse>

// GET /api/generate/[id]
// Response: ApiResponse<GenerateResponse>

// ---------------------------------------------------------------------------
// Save to library
// ---------------------------------------------------------------------------

export type SaveTrackRequest = {
  generationId: string
  title: string
}

export type SaveTrackResponse = {
  trackId: string
  storageUrl: string
}

// POST /api/library/save
// Request body: SaveTrackRequest
// Response: ApiResponse<SaveTrackResponse>

// ---------------------------------------------------------------------------
// Library
// ---------------------------------------------------------------------------

export type SavedTrack = {
  id: string
  generationId: string
  title: string
  durationSeconds: number
  storageUrl: string
  musicTrackId: string
  createdAt: string
}

export type LibraryResponse = {
  tracks: SavedTrack[]
  total: number
}

// GET /api/library
// Response: ApiResponse<LibraryResponse>

// DELETE /api/library/[id]
// Response: ApiResponse<{ deleted: true }>

// ---------------------------------------------------------------------------
// Subscription
// ---------------------------------------------------------------------------

export type SubscriptionStatus = 'active' | 'inactive' | 'past_due' | 'canceled'

export type SubscriptionPlan = 'monthly' | 'yearly' | null

export type UserSubscription = {
  status: SubscriptionStatus
  plan: SubscriptionPlan
  currentPeriodEnd: string | null
  generationCreditsIncluded: number
  generationCreditsUsed: number
  generationCreditsRemaining: number
}

// GET /api/subscription
// Response: ApiResponse<UserSubscription>

// POST /api/subscription/checkout
// Body: { plan: 'monthly' | 'yearly'; returnUrl: string }
// Response: ApiResponse<{ checkoutUrl: string }>

// POST /api/subscription/portal
// Body: { returnUrl: string }
// Response: ApiResponse<{ portalUrl: string }>

// ---------------------------------------------------------------------------
// Curated tracks
// ---------------------------------------------------------------------------

export type CuratedTrack = {
  id: string
  title: string
  slug: string
  durationSeconds: number
  fullAudioUrl: string
  previewAudioUrl: string
  sortOrder: number
}

// GET /api/curated
// Response: ApiResponse<{ tracks: CuratedTrack[] }>

// ---------------------------------------------------------------------------
// Voices
// ---------------------------------------------------------------------------

export type Voice = {
  id: string
  name: string
  language: 'en' | 'zh'
  previewUrl?: string
  description?: string
}

// GET /api/voices
// Response: ApiResponse<{ voices: Voice[] }>
