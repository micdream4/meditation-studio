"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { getSafeInternalPath } from "@/lib/urls";
import Button from "@/components/ui/Button";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = getSafeInternalPath(searchParams.get("redirectTo"), "/create");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("Incorrect email or password.");
      return;
    }
    router.push(redirectTo);
    router.refresh();
  }

  async function handleGoogle() {
    setOauthLoading(true);
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?redirectTo=${redirectTo}` },
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--color-bg)" }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
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
          <h1 className="text-2xl mb-1" style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}>Welcome back</h1>
          <p className="text-sm mb-8" style={{ color: "var(--color-text-muted)" }}>Sign in to your account</p>

          {/* Google */}
          <Button variant="secondary" className="w-full mb-5" loading={oauthLoading} onClick={handleGoogle}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.859-3.048.859-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
            </svg>
            Continue with Google
          </Button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{ background: "var(--color-border)" }} />
            <span className="text-xs" style={{ color: "var(--color-text-faint)" }}>or</span>
            <div className="flex-1 h-px" style={{ background: "var(--color-border)" }} />
          </div>

          <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)", color: "var(--color-text)" }}
                placeholder="you@example.com"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Password</label>
                <Link href="/forgot-password" className="text-xs" style={{ color: "var(--color-accent)" }}>Forgot password?</Link>
              </div>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)", color: "var(--color-text)" }}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(192,84,74,0.1)", color: "var(--color-error)" }}>{error}</p>
            )}

            <Button type="submit" loading={loading} className="w-full mt-1">Sign in</Button>
          </form>
        </div>

        <p className="text-center text-sm mt-6" style={{ color: "var(--color-text-muted)" }}>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium" style={{ color: "var(--color-accent)" }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}
