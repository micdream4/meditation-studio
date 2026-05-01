"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import AudioPlayer from "@/components/player/AudioPlayer";
import Button from "@/components/ui/Button";
import type { SavedTrack } from "@/types/api";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export default function LibraryPage() {
  const [tracks, setTracks] = useState<SavedTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/library")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setTracks(json.data.tracks);
        else setError("Could not load your library.");
      })
      .catch(() => setError("Could not load your library."))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/library/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setTracks((prev) => prev.filter((t) => t.id !== id));
      }
    } catch { /* ignore */ }
    finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 pt-16 min-h-screen">
        <div className="max-w-3xl mx-auto px-6 py-12">

          <div className="flex items-center justify-between mb-10">
            <div>
              <h1 className="text-3xl md:text-4xl mb-1" style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}>My library</h1>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                {tracks.length} / 20 sessions saved
              </p>
            </div>
            <Link href="/create"><Button>New session</Button></Link>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-20">
              <svg className="animate-spin w-6 h-6" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="var(--color-text-faint)" strokeWidth="3" opacity="0.3" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--color-accent)" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
          )}

          {error && (
            <div className="text-center py-20">
              <p className="text-sm" style={{ color: "var(--color-error)" }}>{error}</p>
            </div>
          )}

          {!loading && !error && tracks.length === 0 && (
            <div className="text-center py-20 flex flex-col items-center gap-5">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "var(--color-surface)" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <circle cx="9" cy="19" r="2" stroke="var(--color-text-faint)" strokeWidth="1.5" />
                  <circle cx="19" cy="17" r="2" stroke="var(--color-text-faint)" strokeWidth="1.5" />
                  <path d="M11 19V7l10-3v10" stroke="var(--color-text-faint)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <p className="text-base font-medium mb-1" style={{ color: "var(--color-text)" }}>Nothing saved yet</p>
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Generate a session and save it here.</p>
              </div>
              <Link href="/create"><Button>Create a session</Button></Link>
            </div>
          )}

          {!loading && tracks.length > 0 && (
            <div className="flex flex-col gap-4">
              {tracks.map((track) => (
                <div key={track.id}>
                  <div
                    className="rounded-2xl p-5 flex flex-col gap-3"
                    style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
                  >
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "var(--color-text)" }}>{track.title}</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--color-text-faint)" }}>
                          {formatDuration(track.durationSeconds)} · {formatDate(track.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={track.storageUrl}
                          download
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)" }}
                          title="Download"
                        >
                          <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
                            <path d="M6 1v8M3 6l3 3 3-3" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M1 11h10" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                        </a>
                        {confirmDelete === track.id ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleDelete(track.id)} disabled={deletingId === track.id} className="px-2.5 py-1 rounded-lg text-xs font-medium" style={{ background: "rgba(192,84,74,0.15)", color: "var(--color-error)" }}>
                              {deletingId === track.id ? "…" : "Delete"}
                            </button>
                            <button onClick={() => setConfirmDelete(null)} className="px-2.5 py-1 rounded-lg text-xs" style={{ color: "var(--color-text-faint)" }}>Cancel</button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmDelete(track.id)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)" }} title="Delete">
                            <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
                              <path d="M1 3h10M4 3V1.5h4V3M2 3l.8 9.5h6.4L10 3" stroke="var(--color-text-muted)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>

                    <AudioPlayer ttsUrl={track.storageUrl} compact />
                  </div>
                </div>
              ))}

              {tracks.length >= 20 && (
                <p className="text-xs text-center pt-2" style={{ color: "var(--color-text-faint)" }}>
                  Library full (20/20). Delete a session to save more.
                </p>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
