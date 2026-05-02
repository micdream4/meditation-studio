export type MusicTrack = {
  id: string;
  label: string;
  description: string;
  url?: string;
  exportUrl?: string;
};

export const MUSIC_TRACKS = [
  { id: "none", label: "None", description: "Voice only", url: undefined },
  {
    id: "soft-piano-breath",
    label: "Soft piano",
    description: "Sparse gentle chords",
    url: "/music/soft-piano-breath.m4a",
    exportUrl: "/music/soft-piano-breath.wav",
  },
  {
    id: "gentle-bells-pad",
    label: "Gentle bells",
    description: "Light warm shimmer",
    url: "/music/gentle-bells-pad.m4a",
    exportUrl: "/music/gentle-bells-pad.wav",
  },
  {
    id: "ocean-waves",
    label: "Ocean waves",
    description: "Slow coastal wash",
    url: "/music/ocean-waves.m4a",
  },
  {
    id: "soft-rain",
    label: "Soft rain",
    description: "Even rain bed",
    url: "/music/soft-rain.m4a",
  },
] as const satisfies readonly MusicTrack[];

const MUSIC_TRACK_ALIASES: Record<string, string> = {
  "meditation-pad": "soft-piano-breath",
  "rainforest-water": "gentle-bells-pad",
};

export const DEFAULT_MUSIC_TRACK_ID = "none";
export const DEFAULT_MUSIC_VOLUME = 0.04;
export const MUSIC_PREVIEW_VOLUME = 0.18;

export function normalizeMusicTrackId(trackId: string | null | undefined) {
  const normalized = trackId?.trim() || DEFAULT_MUSIC_TRACK_ID;
  return MUSIC_TRACK_ALIASES[normalized] ?? normalized;
}

export function getMusicTrack(trackId: string | null | undefined): MusicTrack {
  const normalizedTrackId = normalizeMusicTrackId(trackId);

  return (
    MUSIC_TRACKS.find((track) => track.id === normalizedTrackId) ??
    MUSIC_TRACKS.find((track) => track.id === DEFAULT_MUSIC_TRACK_ID)!
  );
}

export function getInitialMusicTrackId(value: string | undefined) {
  const trackId = normalizeMusicTrackId(value);
  return MUSIC_TRACKS.some((track) => track.id === trackId)
    ? trackId
    : DEFAULT_MUSIC_TRACK_ID;
}
