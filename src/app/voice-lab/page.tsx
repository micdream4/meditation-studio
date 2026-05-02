"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import Navbar from "@/components/layout/Navbar";
import Button from "@/components/ui/Button";
import {
  DEFAULT_VOICE_LAB_SAMPLE_TEXT,
  VOICE_LAB_PRESETS,
  type VoiceLabPresetId,
} from "@/lib/voice-lab";
import type { Voice } from "@/types/api";

type SampleStatus = "idle" | "queued" | "generating" | "ready" | "failed";

type SampleResult = {
  status: SampleStatus;
  audioUrl?: string;
  error?: string;
};

type ScoreMap = Record<string, number>;
type NotesMap = Record<string, string>;

function sampleKey(voiceId: string, presetId: string) {
  return `${voiceId}::${presetId}`;
}

function parseSampleKey(key: string) {
  const [voiceId, presetId] = key.split("::");
  return { voiceId: voiceId ?? "", presetId: presetId as VoiceLabPresetId };
}

function loadJsonMap<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

export default function VoiceLabPage() {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [voicesLoading, setVoicesLoading] = useState(true);
  const [selectedVoiceIds, setSelectedVoiceIds] = useState<string[]>([]);
  const [selectedPresetIds, setSelectedPresetIds] = useState<VoiceLabPresetId[]>(
    VOICE_LAB_PRESETS.map((preset) => preset.id),
  );
  const [sampleText, setSampleText] = useState(DEFAULT_VOICE_LAB_SAMPLE_TEXT);
  const [results, setResults] = useState<Record<string, SampleResult>>({});
  const [scores, setScores] = useState<ScoreMap>({});
  const [notes, setNotes] = useState<NotesMap>({});
  const [running, setRunning] = useState(false);
  const objectUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    setScores(loadJsonMap<ScoreMap>("voice-lab-scores", {}));
    setNotes(loadJsonMap<NotesMap>("voice-lab-notes", {}));

    fetch("/api/voices")
      .then((response) => response.json())
      .then((json) => {
        if (json.success) {
          const nextVoices = json.data.voices as Voice[];
          setVoices(nextVoices);
          setSelectedVoiceIds(nextVoices.slice(0, 4).map((voice) => voice.id));
        }
      })
      .finally(() => setVoicesLoading(false));

    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlsRef.current = [];
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem("voice-lab-scores", JSON.stringify(scores));
  }, [scores]);

  useEffect(() => {
    window.localStorage.setItem("voice-lab-notes", JSON.stringify(notes));
  }, [notes]);

  const selectedVoices = useMemo(
    () => voices.filter((voice) => selectedVoiceIds.includes(voice.id)),
    [voices, selectedVoiceIds],
  );

  const selectedPresets = useMemo(
    () => VOICE_LAB_PRESETS.filter((preset) => selectedPresetIds.includes(preset.id)),
    [selectedPresetIds],
  );

  const jobs = useMemo(
    () => selectedVoices.flatMap((voice) =>
      selectedPresets.map((preset) => ({
        key: sampleKey(voice.id, preset.id),
        voice,
        preset,
      })),
    ),
    [selectedVoices, selectedPresets],
  );

  function toggleVoice(voiceId: string) {
    setSelectedVoiceIds((current) =>
      current.includes(voiceId)
        ? current.filter((id) => id !== voiceId)
        : [...current, voiceId],
    );
  }

  function togglePreset(presetId: VoiceLabPresetId) {
    setSelectedPresetIds((current) =>
      current.includes(presetId)
        ? current.filter((id) => id !== presetId)
        : [...current, presetId],
    );
  }

  async function generateSample(key: string) {
    const { voiceId, presetId } = parseSampleKey(key);

    setResults((current) => ({
      ...current,
      [key]: { status: "generating" },
    }));

    try {
      const response = await fetch("/api/voice-lab/sample", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voiceId, presetId, text: sampleText }),
      });

      if (!response.ok) {
        const json = await response.json().catch(() => null);
        throw new Error(json?.error?.message ?? "Sample generation failed.");
      }

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      objectUrlsRef.current.push(audioUrl);
      setResults((current) => ({
        ...current,
        [key]: { status: "ready", audioUrl },
      }));
    } catch (error) {
      setResults((current) => ({
        ...current,
        [key]: {
          status: "failed",
          error: error instanceof Error ? error.message : "Sample generation failed.",
        },
      }));
    }
  }

  async function generateBatch() {
    if (jobs.length === 0 || running) return;

    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrlsRef.current = [];
    setRunning(true);
    setResults(
      Object.fromEntries(jobs.map((job) => [job.key, { status: "queued" as const }])),
    );

    for (const job of jobs) {
      await generateSample(job.key);
    }

    setRunning(false);
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 pt-16 min-h-screen">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="mb-8">
            <p className="text-xs tracking-[0.18em] uppercase mb-3" style={{ color: "var(--color-text-faint)" }}>
              Internal audio QA
            </p>
            <h1 className="text-3xl md:text-4xl mb-3" style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}>
              Voice Lab
            </h1>
            <p className="text-sm leading-relaxed max-w-2xl" style={{ color: "var(--color-text-muted)" }}>
              Test the same meditation passage across voices and delivery settings, then score what sounds closest to a real guided meditation recording.
            </p>
          </div>

          <div className="grid lg:grid-cols-[340px_1fr] gap-5">
            <aside className="flex flex-col gap-4">
              <section className="rounded-2xl p-5" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-medium" style={{ color: "var(--color-text)" }}>Voices</h2>
                  <span className="text-xs" style={{ color: "var(--color-text-faint)" }}>{selectedVoiceIds.length} selected</span>
                </div>
                {voicesLoading ? (
                  <p className="text-xs" style={{ color: "var(--color-text-faint)" }}>Loading voices...</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {voices.slice(0, 8).map((voice) => {
                      const selected = selectedVoiceIds.includes(voice.id);
                      return (
                        <button
                          key={voice.id}
                          type="button"
                          onClick={() => toggleVoice(voice.id)}
                          className="text-left rounded-xl px-3 py-2 transition-all"
                          style={selected
                            ? { background: "var(--color-accent-muted)", border: "1px solid rgba(107,143,113,0.32)", color: "var(--color-accent)" }
                            : { background: "var(--color-surface-raised)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
                        >
                          <span className="block text-sm font-medium truncate">{voice.name}</span>
                          {voice.description && (
                            <span className="block text-[11px] mt-0.5 truncate" style={{ color: "var(--color-text-faint)" }}>
                              {voice.description}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>

              <section className="rounded-2xl p-5" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                <h2 className="text-sm font-medium mb-3" style={{ color: "var(--color-text)" }}>Presets</h2>
                <div className="flex flex-col gap-2">
                  {VOICE_LAB_PRESETS.map((preset) => {
                    const selected = selectedPresetIds.includes(preset.id);
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => togglePreset(preset.id)}
                        className="text-left rounded-xl px-3 py-2 transition-all"
                        style={selected
                          ? { background: "var(--color-accent-muted)", border: "1px solid rgba(107,143,113,0.32)", color: "var(--color-accent)" }
                          : { background: "var(--color-surface-raised)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
                      >
                        <span className="block text-sm font-medium">{preset.label}</span>
                        <span className="block text-[11px] mt-0.5" style={{ color: "var(--color-text-faint)" }}>
                          {preset.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-2xl p-5" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-medium" style={{ color: "var(--color-text)" }}>Sample script</h2>
                  <span className="text-xs" style={{ color: sampleText.length > 450 ? "var(--color-error)" : "var(--color-text-faint)" }}>
                    {sampleText.length}/500
                  </span>
                </div>
                <textarea
                  value={sampleText}
                  onChange={(event) => setSampleText(event.target.value.slice(0, 500))}
                  rows={8}
                  className="w-full px-3 py-3 rounded-xl text-sm outline-none resize-none"
                  style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)", color: "var(--color-text)" }}
                />
              </section>
            </aside>

            <section className="rounded-2xl p-5" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                  <h2 className="text-sm font-medium" style={{ color: "var(--color-text)" }}>Samples</h2>
                  <p className="text-xs mt-1" style={{ color: "var(--color-text-faint)" }}>
                    {jobs.length} samples selected. Generation runs one by one to avoid provider bursts.
                  </p>
                </div>
                <Button
                  size="sm"
                  loading={running}
                  disabled={jobs.length === 0 || sampleText.trim().length < 20}
                  onClick={generateBatch}
                >
                  Generate selected
                </Button>
              </div>

              {jobs.length === 0 ? (
                <div className="py-16 text-center text-sm" style={{ color: "var(--color-text-faint)" }}>
                  Select at least one voice and one preset.
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-3">
                  {jobs.map(({ key, voice, preset }) => {
                    const result = results[key] ?? { status: "idle" as const };
                    return (
                      <div
                        key={key}
                        className="rounded-xl p-4 flex flex-col gap-3"
                        style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)" }}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: "var(--color-text)" }}>{voice.name}</p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-faint)" }}>{preset.label}</p>
                        </div>

                        {result.status === "ready" && result.audioUrl ? (
                          <audio controls src={result.audioUrl} className="w-full h-9" />
                        ) : (
                          <div className="h-9 rounded-lg flex items-center px-3 text-xs" style={{ background: "var(--color-surface)", color: result.status === "failed" ? "var(--color-error)" : "var(--color-text-faint)" }}>
                            {result.status === "idle" && "Not generated"}
                            {result.status === "queued" && "Queued"}
                            {result.status === "generating" && "Generating..."}
                            {result.status === "failed" && (result.error ?? "Failed")}
                          </div>
                        )}

                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((score) => (
                            <button
                              key={score}
                              type="button"
                              onClick={() => setScores((current) => ({ ...current, [key]: score }))}
                              className="w-7 h-7 rounded-full text-xs font-medium"
                              style={{
                                background: scores[key] === score ? "var(--color-accent)" : "var(--color-surface)",
                                color: scores[key] === score ? "#fff" : "var(--color-text-muted)",
                                border: "1px solid var(--color-border)",
                              }}
                            >
                              {score}
                            </button>
                          ))}
                        </div>

                        <textarea
                          value={notes[key] ?? ""}
                          onChange={(event) => setNotes((current) => ({ ...current, [key]: event.target.value }))}
                          rows={2}
                          placeholder="Notes: pacing, warmth, mechanical artifacts..."
                          className="w-full px-3 py-2 rounded-lg text-xs outline-none resize-none"
                          style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)" }}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
