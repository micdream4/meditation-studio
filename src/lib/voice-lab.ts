export type VoiceLabPresetId =
  | "meditation-default"
  | "more-expressive"
  | "steady-narrator";

export type VoiceLabSettings = {
  stability: number;
  similarity_boost: number;
  style: number;
  use_speaker_boost: boolean;
  speed: number;
};

export const VOICE_LAB_PRESETS: Array<{
  id: VoiceLabPresetId;
  label: string;
  description: string;
  settings: VoiceLabSettings;
}> = [
  {
    id: "meditation-default",
    label: "Meditation default",
    description: "Current slow production setting",
    settings: {
      stability: 0.48,
      similarity_boost: 0.72,
      style: 0.28,
      use_speaker_boost: true,
      speed: 0.7,
    },
  },
  {
    id: "more-expressive",
    label: "More expressive",
    description: "Less stable, more emotional movement",
    settings: {
      stability: 0.34,
      similarity_boost: 0.66,
      style: 0.46,
      use_speaker_boost: true,
      speed: 0.7,
    },
  },
  {
    id: "steady-narrator",
    label: "Steady narrator",
    description: "Smoother and less theatrical",
    settings: {
      stability: 0.62,
      similarity_boost: 0.78,
      style: 0.18,
      use_speaker_boost: true,
      speed: 0.74,
    },
  },
];

export const DEFAULT_VOICE_LAB_SAMPLE_TEXT = [
  "Take a slow breath in.",
  "[pause]",
  "And gently let it go.",
  "[pause]",
  "Let your shoulders soften.",
  "Let your jaw release.",
  "[pause]",
  "For the next few moments, there is nowhere else you need to be.",
].join("\n");

export function getVoiceLabPreset(presetId: string) {
  return VOICE_LAB_PRESETS.find((preset) => preset.id === presetId) ?? null;
}
