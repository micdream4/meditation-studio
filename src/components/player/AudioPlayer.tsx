"use client";

import { useEffect, useRef, useState, useCallback } from "react";

import { DEFAULT_MUSIC_VOLUME } from "@/lib/music";

interface AudioPlayerProps {
  ttsUrl: string;
  musicUrl?: string;
  title?: string;
  onSave?: () => void;
  onDownload?: () => void;
  saving?: boolean;
  compact?: boolean;
}

function formatTime(seconds: number) {
  if (isNaN(seconds) || !isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const WAVEFORM_HEIGHTS = [10, 18, 28, 14, 32, 20, 12, 26, 16, 30, 22, 10, 24, 18, 28, 14, 32, 20, 12, 26, 16, 8, 22, 30, 14];
const PLAYBACK_RATES = [0.9, 1, 1.1] as const;
const COMPACT_PLAY_EVENT = "meditation-audio-play";

type PitchPreservingAudio = HTMLAudioElement & {
  preservesPitch?: boolean;
  webkitPreservesPitch?: boolean;
  mozPreservesPitch?: boolean;
};

function preservePitch(audio: HTMLAudioElement) {
  const pitchSafeAudio = audio as PitchPreservingAudio;
  pitchSafeAudio.preservesPitch = true;
  pitchSafeAudio.webkitPreservesPitch = true;
  pitchSafeAudio.mozPreservesPitch = true;
}

export default function AudioPlayer({ ttsUrl, musicUrl, title, onSave, onDownload, saving, compact = false }: AudioPlayerProps) {
  const compactAudioRef = useRef<HTMLAudioElement | null>(null);
  const playerIdRef = useRef<string>(crypto.randomUUID());
  const audioCtxRef   = useRef<AudioContext | null>(null);
  const ttsSourceRef  = useRef<AudioBufferSourceNode | null>(null);
  const musicSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const ttsGainRef    = useRef<GainNode | null>(null);
  const musicGainRef  = useRef<GainNode | null>(null);
  const ttsBufferRef  = useRef<AudioBuffer | null>(null);
  const musicBufferRef = useRef<AudioBuffer | null>(null);
  const startTimeRef  = useRef<number>(0);
  const offsetRef     = useRef<number>(0);
  const animFrameRef  = useRef<number>(0);

  const [playing,     setPlaying]     = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration,    setDuration]    = useState(0);
  const [ttsVol,      setTtsVol]      = useState(1);
  const [musicVol,    setMusicVol]    = useState(DEFAULT_MUSIC_VOLUME);
  const [playbackRate, setPlaybackRate] = useState<(typeof PLAYBACK_RATES)[number]>(1);
  const [loaded,      setLoaded]      = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  useEffect(() => {
    if (compact) {
      return;
    }

    let cancelled = false;
    setLoaded(false);
    setError(null);
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    offsetRef.current = 0;

    async function load() {
      try {
        const ctx = new AudioContext();
        audioCtxRef.current = ctx;
        ttsGainRef.current = ctx.createGain();
        ttsGainRef.current.gain.value = ttsVol;
        ttsGainRef.current.connect(ctx.destination);

        const ttsData = await fetch(ttsUrl).then((r) => r.arrayBuffer());
        if (cancelled) return;
        const ttsBuffer = await ctx.decodeAudioData(ttsData);
        if (cancelled) return;
        ttsBufferRef.current = ttsBuffer;
        setDuration(ttsBuffer.duration);

        if (musicUrl) {
          musicGainRef.current = ctx.createGain();
          musicGainRef.current.gain.value = musicVol;
          musicGainRef.current.connect(ctx.destination);
          const musicData = await fetch(musicUrl).then((r) => r.arrayBuffer());
          if (cancelled) return;
          const musicBuffer = await ctx.decodeAudioData(musicData);
          if (cancelled) return;
          musicBufferRef.current = musicBuffer;
        }
        setLoaded(true);
      } catch (e) {
        if (!cancelled) setError("Failed to load audio.");
        console.error(e);
      }
    }

    load();
    return () => {
      cancelled = true;
      stopSources();
      audioCtxRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compact, ttsUrl, musicUrl]);

  useEffect(() => {
    if (!compact) {
      return;
    }

    const audio = new Audio(ttsUrl);
    compactAudioRef.current = audio;
    audio.preload = "metadata";
    audio.volume = ttsVol;
    audio.playbackRate = playbackRate;
    preservePitch(audio);

    setLoaded(false);
    setError(null);
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setLoaded(true);
    };
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => {
      setPlaying(false);
      setCurrentTime(0);
      audio.currentTime = 0;
    };
    const handleError = () => {
      setError("Failed to load audio.");
      setLoaded(false);
    };
    const handleGlobalPlay = (event: Event) => {
      const activeId = (event as CustomEvent<string>).detail;
      if (activeId !== playerIdRef.current && !audio.paused) {
        audio.pause();
        setPlaying(false);
      }
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);
    window.addEventListener(COMPACT_PLAY_EVENT, handleGlobalPlay);

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      window.removeEventListener(COMPACT_PLAY_EVENT, handleGlobalPlay);
      if (compactAudioRef.current === audio) {
        compactAudioRef.current = null;
      }
    };
  // The active audio element should only be recreated when the source changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compact, ttsUrl]);

  function stopSources() {
    try { ttsSourceRef.current?.stop(); } catch { }
    try { musicSourceRef.current?.stop(); } catch { }
    ttsSourceRef.current = null;
    musicSourceRef.current = null;
  }

  const startPlayback = useCallback((offset: number) => {
    const ctx = audioCtxRef.current;
    if (!ctx || !ttsBufferRef.current) return;
    stopSources();

    const ttsSource = ctx.createBufferSource();
    ttsSource.buffer = ttsBufferRef.current;
    ttsSource.playbackRate.value = playbackRate;
    ttsSource.connect(ttsGainRef.current!);
    ttsSource.start(0, offset);
    ttsSource.onended = () => {
      if (ttsSourceRef.current === ttsSource) {
        setPlaying(false);
        setCurrentTime(0);
        offsetRef.current = 0;
        cancelAnimationFrame(animFrameRef.current);
      }
    };
    ttsSourceRef.current = ttsSource;

    if (musicBufferRef.current && musicGainRef.current) {
      const musicSource = ctx.createBufferSource();
      musicSource.buffer = musicBufferRef.current;
      musicSource.loop = true;
      musicSource.connect(musicGainRef.current);
      musicSource.start(0, offset % musicBufferRef.current.duration);
      musicSourceRef.current = musicSource;
    }

    startTimeRef.current = ctx.currentTime - offset / playbackRate;

    const tick = () => {
      if (ctx && ttsSourceRef.current) {
        const elapsed = (ctx.currentTime - startTimeRef.current) * playbackRate;
        setCurrentTime(Math.min(elapsed, ttsBufferRef.current!.duration));
        animFrameRef.current = requestAnimationFrame(tick);
      }
    };
    animFrameRef.current = requestAnimationFrame(tick);
  }, [playbackRate]);

  function togglePlay() {
    if (!loaded) return;
    const ctx = audioCtxRef.current!;
    if (ctx.state === "suspended") ctx.resume();
    if (playing) {
      stopSources();
      cancelAnimationFrame(animFrameRef.current);
      offsetRef.current = (audioCtxRef.current!.currentTime - startTimeRef.current) * playbackRate;
      setPlaying(false);
    } else {
      startPlayback(offsetRef.current);
      setPlaying(true);
    }
  }

  function seek(pct: number) {
    const newOffset = pct * (ttsBufferRef.current?.duration ?? 0);
    offsetRef.current = newOffset;
    if (playing) startPlayback(newOffset);
    else setCurrentTime(newOffset);
  }

  function toggleCompactPlay() {
    const audio = compactAudioRef.current;
    if (!audio || !loaded) return;

    if (!audio.paused) {
      audio.pause();
      setPlaying(false);
      return;
    }

    window.dispatchEvent(new CustomEvent(COMPACT_PLAY_EVENT, { detail: playerIdRef.current }));
    preservePitch(audio);
    audio.playbackRate = playbackRate;
    audio.play()
      .then(() => setPlaying(true))
      .catch(() => {
        setError("Playback failed.");
        setPlaying(false);
      });
  }

  function seekCompact(pct: number) {
    const audio = compactAudioRef.current;
    if (!audio || !duration) return;

    const nextTime = Math.min(Math.max(pct, 0), 1) * duration;
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  }

  useEffect(() => {
    if (compactAudioRef.current) {
      compactAudioRef.current.volume = ttsVol;
    }
    if (ttsGainRef.current) ttsGainRef.current.gain.value = ttsVol;
  }, [ttsVol]);
  useEffect(() => { if (musicGainRef.current) musicGainRef.current.gain.value = musicVol; }, [musicVol]);
  useEffect(() => {
    if (compact) {
      if (compactAudioRef.current) {
        compactAudioRef.current.playbackRate = playbackRate;
        preservePitch(compactAudioRef.current);
      }
      return;
    }

    if (!playing) return;
    offsetRef.current = currentTime;
    startPlayback(offsetRef.current);
  // Restart only when the user changes speed while audio is playing.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compact, playbackRate]);

  const progress = duration > 0 ? currentTime / duration : 0;

  if (compact) {
    return (
      <div
        className="rounded-2xl px-4 py-3"
        style={{ background: "linear-gradient(160deg, rgba(107,143,113,0.05) 0%, rgba(192,122,90,0.035) 100%)", border: "1px solid var(--color-border)" }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={toggleCompactPlay}
            disabled={!loaded}
            className="relative w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-transform duration-150 hover:scale-105 active:scale-95"
            style={{
              background: loaded
                ? "linear-gradient(140deg, #78a07e 0%, #5a7a60 100%)"
                : "var(--color-surface-raised)",
              boxShadow: loaded ? "0 4px 16px rgba(107,143,113,0.32)" : "none",
            }}
            title={playing ? "Pause" : "Play"}
          >
            {!loaded && !error ? (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" opacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
              </svg>
            ) : playing ? (
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <rect x="2" y="1" width="4" height="12" rx="1.5" fill="white" />
                <rect x="8" y="1" width="4" height="12" rx="1.5" fill="white" />
              </svg>
            ) : (
              <svg width="12" height="14" viewBox="0 0 14 16" fill="none" style={{ marginLeft: "2px" }}>
                <path d="M1 1.5l12 6.5-12 6.5V1.5z" fill="white" />
              </svg>
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <span className="text-xs tabular-nums w-20" style={{ color: "var(--color-text-muted)" }}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
              <div
                className="player-track flex-1"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  seekCompact((e.clientX - rect.left) / rect.width);
                }}
              >
                <div
                  className="h-full rounded-full"
                  style={{ width: `${progress * 100}%`, background: "linear-gradient(90deg, #6b8f71, #7ea584)" }}
                />
                <div className="player-thumb" style={{ left: `${progress * 100}%` }} />
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px]" style={{ color: "var(--color-text-faint)" }}>Speed</span>
                {PLAYBACK_RATES.map((rate) => (
                  <button
                    key={rate}
                    onClick={() => setPlaybackRate(rate)}
                    className="px-2 py-1 rounded-full text-[11px] font-medium transition-colors"
                    style={{
                      background: playbackRate === rate ? "rgba(107,143,113,0.15)" : "transparent",
                      color: playbackRate === rate ? "var(--color-accent)" : "var(--color-text-muted)",
                      border: playbackRate === rate ? "1px solid rgba(107,143,113,0.24)" : "1px solid transparent",
                    }}
                  >
                    {rate}x
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 min-w-[160px]">
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
                  <path d="M2 5h2.5L8 2v10L4.5 9H2V5z" fill="var(--color-text-faint)" />
                  <path d="M10 4.5a3.5 3.5 0 0 1 0 5" stroke="var(--color-text-faint)" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                <div className="flex-1 relative">
                  <div className="h-[3px] rounded-full" style={{ background: "var(--color-surface-raised)" }}>
                    <div
                      className="absolute left-0 top-0 h-full rounded-full"
                      style={{ width: `${ttsVol * 100}%`, background: "var(--color-accent)" }}
                    />
                  </div>
                  <input
                    type="range" min={0} max={1} step={0.01} value={ttsVol}
                    onChange={(e) => setTtsVol(+e.target.value)}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer"
                    style={{ height: "3px" }}
                    aria-label="Voice volume"
                  />
                </div>
                <span className="text-[11px] w-6 text-right tabular-nums" style={{ color: "var(--color-text-faint)" }}>
                  {Math.round(ttsVol * 100)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <p className="text-xs mt-2" style={{ color: "var(--color-error)" }}>{error}</p>
        )}
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
    >
      {/* Header: ambient gradient + waveform visualization */}
      <div
        className="relative px-6 pt-5 pb-4 flex items-end justify-between gap-4"
        style={{ background: "linear-gradient(160deg, rgba(107,143,113,0.08) 0%, rgba(192,122,90,0.05) 100%)" }}
      >
        {/* Track info */}
        <div className="flex-1 min-w-0">
          {title && (
            <p className="text-sm font-medium truncate mb-0.5" style={{ color: "var(--color-text)" }}>{title}</p>
          )}
          <p className="text-xs" style={{ color: "var(--color-text-faint)" }}>
            {!loaded && !error ? <span className="shimmer-text">Loading…</span> : error ? "Error" : "Ready to play"}
          </p>
        </div>

        {/* Decorative waveform */}
        <div className="flex items-end gap-[2px] h-8 flex-shrink-0 opacity-50">
          {WAVEFORM_HEIGHTS.map((h, i) => (
            <div
              key={i}
              className={playing ? "wave-bar" : ""}
              style={{
                width: "2px",
                height: playing ? `${h}px` : `${Math.max(3, h * 0.3)}px`,
                background: playing ? "var(--color-accent)" : "var(--color-text-faint)",
                borderRadius: "1px",
                flexShrink: 0,
                transition: "height 0.3s ease",
              }}
            />
          ))}
        </div>
      </div>

      {/* Player body */}
      <div className="px-6 pb-5 pt-4 flex flex-col gap-4">
        {/* Progress bar */}
        <div>
          <div
            className="player-track"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              seek((e.clientX - rect.left) / rect.width);
            }}
          >
            <div
              className="h-full rounded-full"
              style={{ width: `${progress * 100}%`, background: "linear-gradient(90deg, #6b8f71, #7ea584)" }}
            />
            <div className="player-thumb" style={{ left: `${progress * 100}%` }} />
          </div>
          <div className="flex justify-between mt-2 text-xs tabular-nums" style={{ color: "var(--color-text-faint)" }}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Play/pause + volume */}
        <div className="flex items-center gap-5">
          {/* Play button */}
          <button
            onClick={togglePlay}
            disabled={!loaded}
            className="relative w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-transform duration-150 hover:scale-105 active:scale-95"
            style={{
              background: loaded
                ? "linear-gradient(140deg, #78a07e 0%, #5a7a60 100%)"
                : "var(--color-surface-raised)",
              boxShadow: loaded ? "0 4px 20px rgba(107,143,113,0.45), 0 2px 6px rgba(0,0,0,0.1)" : "none",
            }}
          >
            {!loaded && !error ? (
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" opacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
              </svg>
            ) : playing ? (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="2" y="1" width="4" height="12" rx="1.5" fill="white" />
                <rect x="8" y="1" width="4" height="12" rx="1.5" fill="white" />
              </svg>
            ) : (
              <svg width="14" height="16" viewBox="0 0 14 16" fill="none" style={{ marginLeft: "2px" }}>
                <path d="M1 1.5l12 6.5-12 6.5V1.5z" fill="white" />
              </svg>
            )}
          </button>

          {/* Volume controls */}
          <div className="flex flex-col gap-2 flex-1">
            {/* Voice volume */}
            <div className="flex items-center gap-2.5">
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
                <path d="M2 5h2.5L8 2v10L4.5 9H2V5z" fill="var(--color-text-faint)" />
                <path d="M10 4.5a3.5 3.5 0 0 1 0 5" stroke="var(--color-text-faint)" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              <div className="flex-1 relative">
                <div className="h-[3px] rounded-full" style={{ background: "var(--color-surface-raised)" }}>
                  <div
                    className="absolute left-0 top-0 h-full rounded-full"
                    style={{ width: `${ttsVol * 100}%`, background: "var(--color-accent)" }}
                  />
                </div>
                <input
                  type="range" min={0} max={1} step={0.01} value={ttsVol}
                  onChange={(e) => setTtsVol(+e.target.value)}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer"
                  style={{ height: "3px" }}
                />
              </div>
              <span className="text-[11px] w-5 text-right tabular-nums" style={{ color: "var(--color-text-faint)" }}>
                {Math.round(ttsVol * 100)}
              </span>
            </div>

            {/* Music volume */}
            {musicUrl && (
              <div className="flex items-center gap-2.5">
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
                  <circle cx="4" cy="10" r="2" stroke="var(--color-text-faint)" strokeWidth="1.2" />
                  <circle cx="10" cy="8" r="2" stroke="var(--color-text-faint)" strokeWidth="1.2" />
                  <path d="M6 10V4l6-1.5V8" stroke="var(--color-text-faint)" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                <div className="flex-1 relative">
                  <div className="h-[3px] rounded-full" style={{ background: "var(--color-surface-raised)" }}>
                    <div
                      className="absolute left-0 top-0 h-full rounded-full"
                      style={{ width: `${musicVol * 100}%`, background: "var(--color-accent-warm)" }}
                    />
                  </div>
                  <input
                    type="range" min={0} max={1} step={0.01} value={musicVol}
                    onChange={(e) => setMusicVol(+e.target.value)}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer"
                    style={{ height: "3px" }}
                  />
                </div>
                <span className="text-[11px] w-5 text-right tabular-nums" style={{ color: "var(--color-text-faint)" }}>
                  {Math.round(musicVol * 100)}
                </span>
              </div>
            )}
          </div>
        </div>

        {error && (
          <p className="text-xs" style={{ color: "var(--color-error)" }}>{error}</p>
        )}
      </div>

      {/* Save / Download footer */}
      {(onSave || onDownload) && (
        <div
          className="px-6 pb-5 flex gap-2"
          style={{ borderTop: "1px solid var(--color-border-subtle)", paddingTop: "16px" }}
        >
          {onSave && (
            <button
              onClick={onSave}
              disabled={saving}
              className="flex-1 text-xs py-2.5 rounded-xl font-medium transition-all duration-150 hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
              style={{
                background: "rgba(107,143,113,0.09)",
                color: "var(--color-accent)",
                border: "1px solid rgba(107,143,113,0.18)",
              }}
            >
              {saving ? "Saving…" : "Save to library"}
            </button>
          )}
          {onDownload && (
            <button
              onClick={onDownload}
              className="flex-1 text-xs py-2.5 rounded-xl font-medium transition-all duration-150 hover:opacity-90 active:scale-[0.98]"
              style={{
                background: "var(--color-surface-raised)",
                color: "var(--color-text-muted)",
                border: "1px solid var(--color-border)",
              }}
            >
              Download MP3
            </button>
          )}
        </div>
      )}
    </div>
  );
}
