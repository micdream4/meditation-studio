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
      stability: 0.42,
      similarity_boost: 0.7,
      style: 0.36,
      use_speaker_boost: true,
      speed: 0.64,
    },
  },
  {
    id: "more-expressive",
    label: "More expressive",
    description: "Less stable, more emotional movement",
    settings: {
      stability: 0.3,
      similarity_boost: 0.64,
      style: 0.55,
      use_speaker_boost: true,
      speed: 0.64,
    },
  },
  {
    id: "steady-narrator",
    label: "Steady narrator",
    description: "Smoother and less theatrical",
    settings: {
      stability: 0.58,
      similarity_boost: 0.76,
      style: 0.22,
      use_speaker_boost: true,
      speed: 0.68,
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
