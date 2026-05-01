"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function QuickStart() {
  const [text, setText] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    router.push(`/create?mode=mood&feeling=${encodeURIComponent(trimmed)}`);
  }

  return (
    <section className="py-16">
      <div className="max-w-2xl mx-auto px-6">
        <div
          className="rounded-3xl p-8 md:p-10"
          style={{
            background: "linear-gradient(160deg, rgba(107,143,113,0.07) 0%, var(--color-surface) 60%)",
            border: "1px solid rgba(107,143,113,0.14)",
            boxShadow: "0 4px 24px rgba(107,143,113,0.07)",
          }}
        >
          <div className="mb-6">
            <p className="text-xs font-medium tracking-widest uppercase mb-2" style={{ color: "var(--color-accent)" }}>
              Start right now
            </p>
            <h2
              className="text-2xl md:text-3xl leading-snug"
              style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}
            >
              How are you feeling right now?
            </h2>
            <p className="mt-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
              Describe your mood, what&apos;s on your mind, or what you&apos;d like to release. We&apos;ll shape a session around it.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. Stressed from back-to-back meetings, shoulders tight, need to decompress…"
              rows={3}
              className="w-full resize-none rounded-2xl px-5 py-4 text-sm leading-relaxed outline-none transition-all duration-200"
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text)",
                fontFamily: "var(--font-sans)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(107,143,113,0.4)";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(107,143,113,0.08)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--color-border)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs" style={{ color: "var(--color-text-faint)" }}>
                Or browse templates — pick a mood chip above, or{" "}
                <a href="/create" className="underline underline-offset-2 hover:opacity-70 transition-opacity">
                  open the full creator
                </a>
              </p>
              <button
                type="submit"
                disabled={!text.trim()}
                className="btn-base btn-primary text-sm px-6 py-2.5 flex-shrink-0"
              >
                Create session →
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
