"use client";

import { useState } from "react";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import Button from "@/components/ui/Button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?redirectTo=/reset-password`,
    });
    setLoading(false);
    if (error) {
      setError("Could not send reset email. Please try again.");
      return;
    }
    setDone(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--color-bg)" }}>
      <div className="w-full max-w-sm">

        <Link href="/" className="flex items-center justify-center gap-2 mb-10">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #6b8f71 0%, #c07a5a 100%)" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="3" fill="white" opacity="0.9" />
              <circle cx="7" cy="7" r="6" stroke="white" strokeWidth="1.5" opacity="0.4" />
            </svg>
          </div>
          <span className="text-base font-medium" style={{ color: "var(--color-text)" }}>Meditation Studio</span>
        </Link>

        <div className="rounded-2xl p-8" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          {done ? (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: "var(--color-accent-muted)" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17l-5-5" stroke="#6b8f71" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2 className="text-xl mb-2" style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}>Check your email</h2>
              <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--color-text-muted)" }}>
                If an account exists for <strong style={{ color: "var(--color-text)" }}>{email}</strong>, we sent a reset link. Check your inbox.
              </p>
              <Link href="/login"><Button variant="secondary" className="w-full">Back to sign in</Button></Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl mb-1" style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}>Reset password</h1>
              <p className="text-sm mb-8" style={{ color: "var(--color-text-muted)" }}>
                Enter your email and we&apos;ll send you a reset link.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Email</label>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)", color: "var(--color-text)" }}
                    placeholder="you@example.com"
                  />
                </div>

                {error && (
                  <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(192,84,74,0.1)", color: "var(--color-error)" }}>{error}</p>
                )}

                <Button type="submit" loading={loading} className="w-full mt-1">Send reset link</Button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-sm mt-6" style={{ color: "var(--color-text-muted)" }}>
          Remember your password?{" "}
          <Link href="/login" className="font-medium" style={{ color: "var(--color-accent)" }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
