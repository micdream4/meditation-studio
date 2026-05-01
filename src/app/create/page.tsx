"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import AudioPlayer from "@/components/player/AudioPlayer";
import Button from "@/components/ui/Button";
import { IconPause, IconPlay } from "@/components/ui/Icons";
import type { GenerationDurationMinutes, GenerateRequest, GenerateResponse, Voice } from "@/types/api";

type Mode = "mood" | "template" | "custom";
type GenStatus = "idle" | "script" | "voice" | "ready" | "failed";

const MOODS = [
  { value: "anxious", label: "Anxious" },
  { value: "tired", label: "Tired" },
  { value: "sleepless", label: "Can't sleep" },
  { value: "unfocused", label: "Unfocused" },
  { value: "low", label: "Low mood" },
  { value: "other", label: "Other" },
] as const;

const THEMES = [
  { value: "breathing", label: "Breathing" },
  { value: "body-scan", label: "Body Scan" },
  { value: "loving-kindness", label: "Loving Kindness" },
  { value: "sleep-wind-down", label: "Sleep Wind-down" },
  { value: "anxiety-release", label: "Anxiety Release" },
  { value: "focus-reset", label: "Focus Reset" },
  { value: "morning-reset", label: "Morning Reset" },
  { value: "emotional-soothing", label: "Emotional Soothing" },
] as const;

const DURATIONS: GenerationDurationMinutes[] =
  process.env.NODE_ENV === "development" ? [1, 5, 10, 15, 20] : [5, 10, 15, 20];

const MUSIC_TRACKS = [
  { id: "none", label: "None", description: "Voice only", url: undefined },
  { id: "rainforest-water", label: "Rainforest water", description: "Soft forest stream", url: "/music/rainforest-water.mp3" },
  { id: "ocean-waves", label: "Ocean waves", description: "Slow coastal waves", url: "/music/ocean-waves.m4a" },
  { id: "soft-rain", label: "Soft rain", description: "Gentle rain texture", url: "/music/soft-rain.m4a" },
] as const;

const STATUS_LABELS: Record<GenStatus, string> = {
  idle: "",
  script: "Crafting your meditation script…",
  voice: "Generating voice audio…",
  ready: "Your session is ready",
  failed: "Something went wrong",
};

type ThemeValue = (typeof THEMES)[number]["value"];

function ThemeMark({ theme, active }: { theme: ThemeValue; active: boolean }) {
  const stroke = active ? "var(--color-accent)" : "var(--color-text-faint)";
  const fill = active ? "rgba(107,143,113,0.12)" : "rgba(132,122,105,0.08)";

  const common = {
    stroke,
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: "none",
  };

  return (
    <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
      <circle cx="17" cy="17" r="15" fill={fill} />
      {theme === "breathing" && (
        <>
          <path d="M9 16c3-4 7-4 10 0s6 4 8 0" {...common} />
          <path d="M10 21c3-3 6-3 9 0s5 3 7 0" {...common} opacity="0.72" />
          <path d="M13 11c2-2 5-2 7 0" {...common} opacity="0.55" />
        </>
      )}
      {theme === "body-scan" && (
        <>
          <path d="M17 8v18" {...common} />
          <circle cx="17" cy="10" r="2.4" {...common} />
          <path d="M12 16h10M13 21h8" {...common} opacity="0.72" />
        </>
      )}
      {theme === "loving-kindness" && (
        <path d="M17 24s-7-4.4-7-9.2c0-2.2 1.5-3.8 3.6-3.8 1.3 0 2.5.7 3.4 1.9.9-1.2 2.1-1.9 3.4-1.9 2.1 0 3.6 1.6 3.6 3.8C24 19.6 17 24 17 24Z" {...common} />
      )}
      {theme === "sleep-wind-down" && (
        <path d="M21.6 9.5a8.2 8.2 0 1 0 2.9 12.9 7.8 7.8 0 0 1-8.9-10.8 7.6 7.6 0 0 1 6-2.1Z" {...common} />
      )}
      {theme === "anxiety-release" && (
        <>
          <path d="M10 22c7.5-.2 12.6-4.1 14-11-7.2.5-12 4.3-14 11Z" {...common} />
          <path d="M11 22c3.9-4.3 7.4-6.7 12.2-9.3" {...common} opacity="0.62" />
        </>
      )}
      {theme === "focus-reset" && (
        <>
          <circle cx="17" cy="17" r="7.5" {...common} />
          <circle cx="17" cy="17" r="2.2" fill={stroke} stroke="none" />
          <path d="M17 7v4M17 23v4M7 17h4M23 17h4" {...common} />
        </>
      )}
      {theme === "morning-reset" && (
        <>
          <path d="M9 22h16" {...common} />
          <path d="M12 22a5 5 0 0 1 10 0" {...common} />
          <path d="M17 8v3M10.6 11.6l2.1 2.1M23.4 11.6l-2.1 2.1" {...common} opacity="0.68" />
        </>
      )}
      {theme === "emotional-soothing" && (
        <>
          <path d="M8 18c2.6-3 5.2-3 7.8 0s5.2 3 7.8 0" {...common} />
          <path d="M10 23c2.1-2.2 4.2-2.2 6.3 0s4.2 2.2 6.3 0" {...common} opacity="0.62" />
        </>
      )}
    </svg>
  );
}

function CreatePageInner() {
  const searchParams = useSearchParams();
  const checkoutStatus = searchParams.get("checkout");
  const defaultMusicTrackId =
    process.env.NEXT_PUBLIC_DEFAULT_MUSIC_TRACK_ID?.trim() || "none";
  const initialMusicTrackId = MUSIC_TRACKS.some((track) => track.id === defaultMusicTrackId)
    ? defaultMusicTrackId
    : "none";
  const [mode, setMode] = useState<Mode>("mood");
  const [mood, setMood] = useState<string>("anxious");
  const [moodDetail, setMoodDetail] = useState("");
  const [focus, setFocus] = useState("");
  const [theme, setTheme] = useState<string>("breathing");
  const [customText, setCustomText] = useState("");
  const [duration, setDuration] = useState<GenerationDurationMinutes>(
    process.env.NODE_ENV === "development" ? 1 : 10,
  );
  const [voiceId, setVoiceId] = useState<string>("");
  const [musicTrackId, setMusicTrackId] = useState(initialMusicTrackId);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [voicesLoading, setVoicesLoading] = useState(true);
  const [voicesError, setVoicesError] = useState<string | null>(null);
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);
  const voicePreviewRef = useRef<HTMLAudioElement | null>(null);
  const [previewingMusicId, setPreviewingMusicId] = useState<string | null>(null);
  const musicPreviewRef = useRef<HTMLAudioElement | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [status, setStatus] = useState<GenStatus>("idle");
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [scriptText, setScriptText] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioVoiceId, setAudioVoiceId] = useState<string | null>(null);
  const [generationInputSignature, setGenerationInputSignature] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [showScript, setShowScript] = useState(false);
  const selectedMusicTrack = MUSIC_TRACKS.find((track) => track.id === musicTrackId) ?? MUSIC_TRACKS[0];

  // Load voices
  useEffect(() => {
    fetch("/api/voices")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setVoices(json.data.voices);
          if (json.data.voices.length > 0) setVoiceId(json.data.voices[0].id);
          setVoicesError(
            json.data.voices.length === 0
              ? "No voices available yet. Enable ElevenLabs voices_read permission or configure voice IDs in .env.local."
              : null,
          );
        }
      })
      .catch(() => {
        setVoicesError("Unable to load voices right now. Check your ElevenLabs API key permissions.");
      })
      .finally(() => {
        setVoicesLoading(false);
      });
  }, []);

  useEffect(() => {
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
      voicePreviewRef.current?.pause();
      musicPreviewRef.current?.pause();
    };
  }, []);

  function handleVoicePreview(voice: Voice) {
    if (!voice.previewUrl) {
      return;
    }

    if (previewingVoiceId === voice.id) {
      voicePreviewRef.current?.pause();
      voicePreviewRef.current = null;
      setPreviewingVoiceId(null);
      return;
    }

    voicePreviewRef.current?.pause();
    musicPreviewRef.current?.pause();
    setPreviewingMusicId(null);
    const audio = new Audio(voice.previewUrl);
    voicePreviewRef.current = audio;
    setPreviewingVoiceId(voice.id);

    audio.onended = () => setPreviewingVoiceId(null);
    audio.onerror = () => setPreviewingVoiceId(null);
    audio.play().catch(() => setPreviewingVoiceId(null));
  }

  function handleMusicPreview(track: (typeof MUSIC_TRACKS)[number]) {
    if (!track.url) {
      return;
    }

    if (previewingMusicId === track.id) {
      musicPreviewRef.current?.pause();
      musicPreviewRef.current = null;
      setPreviewingMusicId(null);
      return;
    }

    musicPreviewRef.current?.pause();
    voicePreviewRef.current?.pause();
    setPreviewingVoiceId(null);

    const audio = new Audio(track.url);
    audio.loop = true;
    audio.volume = 0.55;
    musicPreviewRef.current = audio;
    setPreviewingMusicId(track.id);

    audio.onended = () => setPreviewingMusicId(null);
    audio.onerror = () => setPreviewingMusicId(null);
    audio.play().catch(() => setPreviewingMusicId(null));
  }

  function buildCurrentInput(): GenerateRequest["input"] {
    if (mode === "mood") {
      return {
        mode: "mood",
        mood: mood as never,
        moodDetail: moodDetail || undefined,
        durationMinutes: duration,
        focus: focus || undefined,
      };
    }

    if (mode === "template") {
      return {
        mode: "template",
        theme: theme as never,
        durationMinutes: duration,
      };
    }

    return {
      mode: "custom",
      text: customText,
      durationMinutes: duration,
    };
  }

  function getInputSignature(input: GenerateRequest["input"]) {
    return JSON.stringify(input);
  }

  function pollForAudio(generationIdToPoll: string, expectedVoiceId: string) {
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts++;
      if (attempts > 60) {
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
        setStatus("failed");
        setErrorMsg("Timed out. Please try again.");
        return;
      }
      try {
        const r = await fetch(`/api/generate/${generationIdToPoll}`);
        const j: { success: boolean; data?: GenerateResponse } = await r.json();
        if (!j.success || !j.data) return;
        const { status: s2, audioUrl: u, scriptText: sc } = j.data;
        if (sc) {
          setScriptText(sc);
          setShowScript(true);
        }
        if (s2 === "audio_ready" && u) {
          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
          setAudioUrl(u);
          setAudioVoiceId(expectedVoiceId);
          setStatus("ready");
        } else if (s2 === "failed") {
          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
          setStatus("failed");
          setErrorMsg(sc ?? j.data.errorCode ?? "Voice generation failed. Please try again.");
        }
      } catch { /* keep polling */ }
    }, 2000);
  }

  async function handleGenerate() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    setStatus("script");
    setScriptText(null);
    setAudioUrl(null);
    setAudioVoiceId(null);
    setGenerationInputSignature(null);
    setErrorMsg(null);
    setGenerationId(null);
    setSavedMsg(null);
    setShowScript(false);

    const input = buildCurrentInput();
    const inputSignature = getInputSignature(input);
    const requestedVoiceId = voiceId || "default";
    const body: GenerateRequest = { input, voiceId: requestedVoiceId, musicTrackId };

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json: { success: boolean; data?: GenerateResponse; error?: { message: string } } = await res.json();

      if (!json.success || !json.data) {
        setStatus("failed");
        setErrorMsg(json.error?.message ?? "Generation failed. Please try again.");
        return;
      }

      const { generationId: gId, scriptText: script, audioUrl: url, status: s } = json.data;
      setGenerationId(gId);
      setGenerationInputSignature(inputSignature);
      setScriptText(script ?? null);
      setShowScript(Boolean(script));

      if (s === "failed") {
        setStatus("failed");
        setErrorMsg(script ?? json.data.errorCode ?? "Generation failed. Please try again.");
        return;
      }

      if (s === "audio_ready" && url) {
        setAudioUrl(url);
        setAudioVoiceId(requestedVoiceId);
        setStatus("ready");
        return;
      }

      setStatus("voice");
      pollForAudio(gId, requestedVoiceId);
    } catch {
      setStatus("failed");
      setErrorMsg("Network error. Please check your connection and try again.");
    }
  }

  async function handleRegenerateVoice() {
    if (!generationId || !scriptText) return;
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    const requestedVoiceId = voiceId || "default";
    setStatus("voice");
    setAudioUrl(null);
    setSavedMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/generate/${generationId}/voice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voiceId: requestedVoiceId, musicTrackId }),
      });
      const json: { success: boolean; data?: GenerateResponse; error?: { message: string } } = await res.json();

      if (!json.success || !json.data) {
        setStatus("failed");
        setErrorMsg(json.error?.message ?? "Voice regeneration failed. Please try again.");
        return;
      }

      if (json.data.scriptText) {
        setScriptText(json.data.scriptText);
        setShowScript(true);
      }

      pollForAudio(generationId, requestedVoiceId);
    } catch {
      setStatus("failed");
      setErrorMsg("Network error. Please check your connection and try again.");
    }
  }

  async function handleSave() {
    if (!generationId || !audioUrl) return;
    setSaving(true);
    try {
      const res = await fetch("/api/library/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generationId, title: `${mode === "mood" ? mood : mode === "template" ? theme : "Custom"} · ${duration} min` }),
      });
      const json = await res.json();
      if (json.success) setSavedMsg("Saved to your library.");
      else setSavedMsg(json.error?.message ?? "Could not save.");
    } catch {
      setSavedMsg("Could not save.");
    } finally {
      setSaving(false);
    }
  }

  function handleDownload() {
    if (!audioUrl) return;
    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = `meditation-${duration}min.mp3`;
    a.click();
  }

  const canGenerate =
    status === "idle" || status === "ready" || status === "failed";
  const canRegenerateVoice =
    status === "ready" &&
    Boolean(generationId) &&
    Boolean(scriptText) &&
    Boolean(voiceId) &&
    Boolean(audioVoiceId) &&
    generationInputSignature === getInputSignature(buildCurrentInput()) &&
    audioVoiceId !== voiceId;

  return (
    <>
      <Navbar />
      <main className="flex-1 pt-16 min-h-screen">
        <div className="max-w-3xl mx-auto px-6 py-12">

          {/* Checkout success / canceled banner */}
          {checkoutStatus === "success" && (
            <div className="mb-6 px-5 py-4 rounded-2xl text-sm flex items-center gap-3" style={{ background: "rgba(107,143,113,0.1)", border: "1px solid rgba(107,143,113,0.25)", color: "var(--color-accent)" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
                <circle cx="8" cy="8" r="8" fill="rgba(107,143,113,0.2)" />
                <path d="M5 8l2 2 4-4" stroke="#6b8f71" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Subscription activated — you&apos;re all set. Create your first session below.
            </div>
          )}
          {checkoutStatus === "canceled" && (
            <div className="mb-6 px-5 py-4 rounded-2xl text-sm" style={{ background: "rgba(192,84,74,0.07)", border: "1px solid rgba(192,84,74,0.2)", color: "var(--color-error)" }}>
              Checkout was canceled. You can subscribe anytime from the{" "}
              <a href="/pricing" style={{ textDecoration: "underline" }}>pricing page</a>.
            </div>
          )}

          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl md:text-4xl mb-2" style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}>
              Create a session
            </h1>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              Your meditation will be generated in about 30–90 seconds.
            </p>
          </div>

          {/* Mode tabs */}
          <div className="flex gap-1 p-1 rounded-2xl mb-8 w-fit" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            {([["mood", "Mood-guided"], ["template", "Theme"], ["custom", "Custom"]] as const).map(([m, label]) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                style={mode === m
                  ? { background: "linear-gradient(140deg, #78a07e 0%, #5a7a60 100%)", color: "#fff", boxShadow: "0 2px 10px rgba(107,143,113,0.3)" }
                  : { color: "var(--color-text-muted)" }
                }
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-6">

            {/* ── Mode A: Mood ── */}
            {mode === "mood" && (
              <div className="rounded-2xl p-6 flex flex-col gap-5" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                <div>
                  <p className="text-sm font-medium mb-3" style={{ color: "var(--color-text)" }}>How are you feeling right now?</p>
                  <div className="flex flex-wrap gap-2">
                    {MOODS.map((m) => (
                      <button
                        key={m.value}
                        onClick={() => setMood(m.value)}
                        className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 flex items-center gap-1.5"
                        style={mood === m.value
                          ? { background: "linear-gradient(140deg, #78a07e 0%, #5a7a60 100%)", color: "#fff", boxShadow: "0 2px 10px rgba(107,143,113,0.28)" }
                          : { background: "var(--color-surface-raised)", color: "var(--color-text-muted)", border: "1px solid var(--color-border)" }
                        }
                      >
                        {mood === m.value && (
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="flex-shrink-0">
                            <path d="M2 5l2.5 2.5 3.5-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  {mood === "other" && (
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-2" style={{ color: "var(--color-text)" }}>
                        Tell us a bit more about what you&apos;re feeling
                      </p>
                      <textarea
                        rows={2}
                        value={moodDetail}
                        onChange={(e) => setMoodDetail(e.target.value)}
                        placeholder="Describe your current state in your own words…"
                        className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                        style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)", color: "var(--color-text)" }}
                      />
                    </div>
                  )}
                  <p className="text-sm font-medium mb-2" style={{ color: "var(--color-text)" }}>Anything specific on your mind? <span style={{ color: "var(--color-text-faint)" }}>(optional)</span></p>
                  <textarea
                    rows={2}
                    value={focus}
                    onChange={(e) => setFocus(e.target.value)}
                    placeholder="e.g. work deadline, trouble sleeping, anxious about a conversation…"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                    style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)", color: "var(--color-text)" }}
                  />
                </div>
              </div>
            )}

            {/* ── Mode B: Theme ── */}
            {mode === "template" && (
              <div className="rounded-2xl p-6" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                <p className="text-sm font-medium mb-3" style={{ color: "var(--color-text)" }}>Choose a theme</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {THEMES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setTheme(t.value)}
                      className="flex flex-col items-center gap-2 py-4 px-2 rounded-xl text-xs font-medium transition-all duration-150 relative"
                      style={theme === t.value
                        ? { background: "linear-gradient(160deg, rgba(107,143,113,0.14) 0%, rgba(107,143,113,0.06) 100%)", color: "var(--color-accent)", border: "1px solid rgba(107,143,113,0.3)", boxShadow: "0 2px 10px rgba(107,143,113,0.12)" }
                        : { background: "var(--color-surface-raised)", color: "var(--color-text-muted)", border: "1px solid var(--color-border)" }
                      }
                    >
                      {theme === t.value && (
                        <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: "var(--color-accent)" }}>
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                            <path d="M1.5 4l2 2 3-3" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      )}
                      <ThemeMark theme={t.value} active={theme === t.value} />
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Mode C: Custom ── */}
            {mode === "custom" && (
              <div className="rounded-2xl p-6" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>Write your meditation script</p>
                  <span className="text-xs" style={{ color: customText.length > 1800 ? "var(--color-error)" : "var(--color-text-faint)" }}>
                    {customText.length} / 2000
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value.slice(0, 2000))}
                  placeholder="Describe the meditation you want. The AI will voice exactly what you write…"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                  style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)", color: "var(--color-text)" }}
                />
              </div>
            )}

            {/* Duration + Voice */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-2xl p-5" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>Duration</p>
                    <p className="text-xs mt-1" style={{ color: "var(--color-text-faint)" }}>
                      This session uses {duration} credits.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {DURATIONS.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDuration(d)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
                      style={duration === d
                        ? { background: "linear-gradient(140deg, #78a07e 0%, #5a7a60 100%)", color: "#fff", boxShadow: "0 2px 10px rgba(107,143,113,0.28)" }
                        : { background: "var(--color-surface-raised)", color: "var(--color-text-muted)", border: "1px solid var(--color-border)" }
                      }
                    >
                      {d}m
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl p-5" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                <p className="text-sm font-medium mb-3" style={{ color: "var(--color-text)" }}>Voice</p>
                {voicesLoading ? (
                  <p className="text-xs" style={{ color: "var(--color-text-faint)" }}>Loading voices…</p>
                ) : voices.length === 0 ? (
                  <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-faint)" }}>
                    {voicesError ?? "No voices available right now."}
                  </p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {voices.map((v) => (
                      <div
                        key={v.id}
                        className="flex items-center gap-2 rounded-xl p-1 transition-all"
                        style={voiceId === v.id ? { background: "var(--color-accent-muted)", color: "var(--color-accent)", border: "1px solid rgba(107,143,113,0.3)" } : { background: "var(--color-surface-raised)", color: "var(--color-text-muted)", border: "1px solid var(--color-border)" }}
                      >
                        <button
                          type="button"
                          onClick={() => setVoiceId(v.id)}
                          className="min-w-0 flex-1 flex items-center gap-2 px-2 py-1.5 text-sm text-left"
                          title={v.name}
                        >
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: voiceId === v.id ? "var(--color-accent)" : "var(--color-text-faint)" }} />
                          <span className="truncate">{v.name}</span>
                        </button>
                        <button
                          type="button"
                          disabled={!v.previewUrl}
                          onClick={() => handleVoicePreview(v)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-40"
                          style={{
                            background: previewingVoiceId === v.id ? "var(--color-accent)" : "rgba(255,255,255,0.55)",
                            color: previewingVoiceId === v.id ? "#fff" : "var(--color-text-muted)",
                            border: "1px solid var(--color-border)",
                          }}
                          aria-label={`${previewingVoiceId === v.id ? "Pause" : "Preview"} ${v.name}`}
                          title={v.previewUrl ? "Preview voice" : "No preview available"}
                        >
                          {previewingVoiceId === v.id ? (
                            <IconPause size={14} />
                          ) : (
                            <IconPlay size={13} />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Background sound */}
            <div className="rounded-2xl p-5" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>Background sound</p>
                  <p className="text-xs mt-1" style={{ color: "var(--color-text-faint)" }}>
                    Optional. Default is voice only so the music never surprises you.
                  </p>
                </div>
              </div>
              <div className="grid sm:grid-cols-4 gap-2">
                {MUSIC_TRACKS.map((track) => (
                  <div
                    key={track.id}
                    className="rounded-xl p-1 transition-all"
                    style={musicTrackId === track.id
                      ? { background: "var(--color-accent-muted)", color: "var(--color-accent)", border: "1px solid rgba(107,143,113,0.3)" }
                      : { background: "var(--color-surface-raised)", color: "var(--color-text-muted)", border: "1px solid var(--color-border)" }}
                  >
                    <button
                      type="button"
                      onClick={() => setMusicTrackId(track.id)}
                      className="w-full px-2 py-2 text-left"
                    >
                      <span className="block text-sm font-medium truncate">{track.label}</span>
                      <span className="block text-[11px] mt-1 truncate" style={{ color: "var(--color-text-faint)" }}>{track.description}</span>
                    </button>
                    {track.url && (
                      <button
                        type="button"
                        onClick={() => handleMusicPreview(track)}
                        className="w-full rounded-lg px-2 py-1.5 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-all"
                        style={{
                          background: previewingMusicId === track.id ? "var(--color-accent)" : "rgba(255,255,255,0.5)",
                          color: previewingMusicId === track.id ? "#fff" : "var(--color-text-muted)",
                          border: "1px solid var(--color-border)",
                        }}
                        aria-label={`${previewingMusicId === track.id ? "Pause" : "Preview"} ${track.label}`}
                      >
                        {previewingMusicId === track.id ? (
                          <IconPause size={12} />
                        ) : (
                          <IconPlay size={11} />
                        )}
                        <span>{previewingMusicId === track.id ? "Pause" : "Preview"}</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Generate button */}
            <Button
              size="lg"
              className="w-full"
              loading={status === "script" || status === "voice"}
              disabled={!canGenerate || (mode === "custom" && customText.trim().length < 20)}
              onClick={canRegenerateVoice ? handleRegenerateVoice : handleGenerate}
            >
              {status === "script" || status === "voice"
                ? STATUS_LABELS[status]
                : canRegenerateVoice
                  ? "Regenerate voice with selected voice"
                  : "Generate meditation"}
            </Button>

            {/* Status / result area */}
            {status !== "idle" && (
              <div className="flex flex-col gap-4">

                {/* Status indicator */}
                {(status === "script" || status === "voice") && (
                  <div className="flex items-center gap-3 px-5 py-4 rounded-2xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="wave-bar w-1 rounded-full" style={{ background: "var(--color-accent)", height: "12px" }} />
                      ))}
                    </div>
                    <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{STATUS_LABELS[status]}</p>
                  </div>
                )}

                {/* Script preview */}
                {scriptText && (
                  <div className="rounded-2xl overflow-hidden" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                    <button
                      className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium"
                      style={{ color: "var(--color-text-muted)" }}
                      onClick={() => setShowScript(!showScript)}
                    >
                      <span>View script</span>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transform: showScript ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                        <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    {showScript && (
                      <div className="px-5 pb-5 text-sm leading-relaxed" style={{ color: "var(--color-text-muted)", borderTop: "1px solid var(--color-border-subtle)", paddingTop: "1rem", whiteSpace: "pre-wrap", maxHeight: "300px", overflow: "auto" }}>
                        {scriptText}
                      </div>
                    )}
                  </div>
                )}

                {/* Player */}
                {status === "ready" && audioUrl && (
                  <>
                    <AudioPlayer
                      ttsUrl={audioUrl}
                      musicUrl={selectedMusicTrack.url}
                      title={`${mode === "mood" ? MOODS.find(m => m.value === mood)?.label : mode === "template" ? THEMES.find(t => t.value === theme)?.label : "Custom"} · ${duration} min`}
                      onSave={handleSave}
                      onDownload={handleDownload}
                      saving={saving}
                    />
                    {savedMsg && (
                      <p className="text-xs text-center" style={{ color: savedMsg.includes("Saved") ? "var(--color-success)" : "var(--color-error)" }}>
                        {savedMsg}
                      </p>
                    )}
                  </>
                )}

                {/* Error */}
                {status === "failed" && (
                  <div className="px-5 py-4 rounded-2xl flex items-center justify-between" style={{ background: "rgba(192,84,74,0.08)", border: "1px solid rgba(192,84,74,0.2)" }}>
                    <p className="text-sm" style={{ color: "var(--color-error)" }}>{errorMsg}</p>
                    <Button variant="secondary" size="sm" onClick={handleGenerate}>Retry</Button>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </main>
    </>
  );
}

import { Suspense } from "react";

export default function CreatePage() {
  return (
    <Suspense>
      <CreatePageInner />
    </Suspense>
  );
}
