export type MusicTrack = {
  id: string;
  label: string;
  description: string;
  url?: string;
};

export const MUSIC_TRACKS = [
  { id: "none", label: "None", description: "Voice only", url: undefined },
  {
    id: "meditation-pad",
    label: "Meditation pad",
    description: "Warm low drone",
    url: "/music/meditation-pad.m4a",
  },
  {
    id: "rainforest-water",
    label: "Forest water",
    description: "Soft stream texture",
    url: "/music/rainforest-water.mp3",
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

export const DEFAULT_MUSIC_TRACK_ID = "none";
export const DEFAULT_MUSIC_VOLUME = 0.04;
export const MUSIC_PREVIEW_VOLUME = 0.18;

export function getMusicTrack(trackId: string | null | undefined): MusicTrack {
  return (
    MUSIC_TRACKS.find((track) => track.id === trackId) ??
    MUSIC_TRACKS.find((track) => track.id === DEFAULT_MUSIC_TRACK_ID)!
  );
}

export function getInitialMusicTrackId(value: string | undefined) {
  const trackId = value?.trim() || DEFAULT_MUSIC_TRACK_ID;
  return MUSIC_TRACKS.some((track) => track.id === trackId)
    ? trackId
    : DEFAULT_MUSIC_TRACK_ID;
}
