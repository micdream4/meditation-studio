"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { IconPlay, IconPause } from "@/components/ui/Icons";

const TRACKS = [
  { title: "Breathing Meditation",       duration: "5:31",  file: "01_Breathing_Meditation.mp3" },
  { title: "Breath, Sound & Body",       duration: "12:00", file: "02_Breath_Sound_Body_Meditation.mp3" },
  { title: "Complete Meditation",        duration: "19:01", file: "03_Complete_Meditation_Instructions.mp3" },
  { title: "Working with Difficulties",  duration: "6:55",  file: "04_Meditation_for_Working_with_Difficulties.mp3" },
  { title: "Loving Kindness",            duration: "9:31",  file: "05_Loving_Kindness_Meditation.mp3" },
  { title: "Body and Sound",             duration: "3:06",  file: "06_Body-Sound-Meditation.mp3" },
  { title: "Body Scan",                  duration: "2:45",  file: "07_Body-Scan-Meditation.mp3" },
  { title: "Body Scan for Sleep",        duration: "13:50", file: "08_Body-Scan-for-Sleep.mp3" },
];

const BAR_HEIGHTS = [12, 20, 8, 26, 14, 30, 10, 22, 18, 28];

export default function CuratedTracks() {
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  function handlePlay(idx: number) {
    const src = `/audio/${TRACKS[idx].file}`;

    if (playingIdx === idx) {
      audioRef.current?.pause();
      setPlayingIdx(null);
      return;
    }

    if (audioRef.current) audioRef.current.pause();

    const audio = new Audio(src);
    audio.addEventListener("ended", () => setPlayingIdx(null));
    audio.play();
    audioRef.current = audio;
    setPlayingIdx(idx);
  }

  return (
    <section id="curated" className="py-20" style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <p className="text-xs font-medium tracking-widest uppercase mb-3" style={{ color: "var(--color-accent)" }}>
            Featured sessions
          </p>
          <h2 className="text-3xl md:text-4xl mb-3" style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}>
            Listen to full guided sessions
          </h2>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            All 8 curated sessions are available to play from beginning to end.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TRACKS.map((track, idx) => {
            const isPlaying = playingIdx === idx;
            return (
              <div
                key={track.file}
                className="card-hover rounded-2xl p-5 flex flex-col gap-4 cursor-pointer select-none"
                style={{
                  background: isPlaying
                    ? "linear-gradient(160deg, rgba(107,143,113,0.09) 0%, var(--color-surface) 60%)"
                    : "var(--color-surface)",
                  border: `1px solid ${isPlaying ? "rgba(107,143,113,0.28)" : "var(--color-border)"}`,
                  boxShadow: isPlaying ? "0 8px 28px rgba(107,143,113,0.14)" : "none",
                  transition: "transform 0.4s cubic-bezier(0.25,1,0.5,1), box-shadow 0.4s cubic-bezier(0.25,1,0.5,1), background 0.3s ease, border-color 0.3s ease",
                }}
                onClick={() => handlePlay(idx)}
              >
                {/* Waveform area */}
                <div
                  className="w-full h-14 rounded-xl flex items-end justify-center gap-[2.5px] px-3"
                  style={{ background: isPlaying ? "rgba(107,143,113,0.06)" : "var(--color-surface-raised)" }}
                >
                  {BAR_HEIGHTS.map((_h, i) => (
                    <div
                      key={i}
                      className={isPlaying ? "wave-bar" : "wave-bar-idle"}
                      style={{
                        width: "3px",
                        flexShrink: 0,
                        background: isPlaying ? "var(--color-accent)" : "var(--color-text-faint)",
                        borderRadius: "2px",
                        transition: "background 0.4s ease",
                      }}
                    />
                  ))}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <p className="text-sm font-medium leading-tight mb-0.5" style={{ color: "var(--color-text)" }}>
                    {track.title}
                  </p>
                  <p className="text-xs" style={{ color: "var(--color-text-faint)" }}>{track.duration}</p>
                </div>

                {/* Play button row */}
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-150"
                    style={{
                      background: isPlaying ? "var(--color-accent)" : "var(--color-surface-raised)",
                      border: `1px solid ${isPlaying ? "transparent" : "var(--color-border)"}`,
                      boxShadow: isPlaying ? "0 2px 10px rgba(107,143,113,0.35)" : "none",
                    }}
                  >
                    {isPlaying
                      ? <IconPause size={9}  color="white" />
                      : <IconPlay  size={8}  color="var(--color-text-muted)" />
                    }
                  </div>
                  <span
                    className="text-xs font-medium transition-colors duration-200"
                    style={{ color: isPlaying ? "var(--color-accent)" : "var(--color-text-faint)" }}
                  >
                    {isPlaying ? "Playing..." : "Play full session"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <Link href="/create">
            <Button variant="secondary">Create your own session</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
