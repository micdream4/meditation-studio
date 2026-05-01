"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import Button from "@/components/ui/Button";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError("Could not update password. The reset link may have expired.");
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/create"), 2500);
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
              <h2 className="text-xl mb-2" style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}>Password updated</h2>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Redirecting you to the app…</p>
            </div>
          ) : (
            <>
              <h1 className="text-2xl mb-1" style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}>Set new password</h1>
              <p className="text-sm mb-8" style={{ color: "var(--color-text-muted)" }}>Choose a new password for your account.</p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>New password</label>
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)", color: "var(--color-text)" }}
                    placeholder="At least 8 characters"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Confirm password</label>
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)", color: "var(--color-text)" }}
                    placeholder="Repeat your new password"
                  />
                </div>

                {error && (
                  <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(192,84,74,0.1)", color: "var(--color-error)" }}>{error}</p>
                )}

                <Button type="submit" loading={loading} className="w-full mt-1">Update password</Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
