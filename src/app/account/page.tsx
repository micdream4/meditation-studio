"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Button from "@/components/ui/Button";
import type { UserSubscription } from "@/types/api";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

const STATUS_COLORS: Record<string, string> = {
  active: "#6b8f71",
  past_due: "#fbbf24",
  canceled: "#c0544a",
  inactive: "var(--color-text-faint)",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  past_due: "Past due",
  canceled: "Canceled",
  inactive: "Not subscribed",
};

export default function AccountPage() {
  const [sub, setSub] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    fetch("/api/subscription")
      .then((r) => r.json())
      .then((json) => { if (json.success) setSub(json.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handlePortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/subscription/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnUrl: window.location.href }),
      });
      const json = await res.json();
      if (json.success) window.location.href = json.data.portalUrl;
    } catch { /* ignore */ }
    finally { setPortalLoading(false); }
  }

  const isActive = sub?.status === "active";

  return (
    <>
      <Navbar />
      <main className="flex-1 pt-16 min-h-screen">
        <div className="max-w-2xl mx-auto px-6 py-12">
          <h1 className="text-3xl md:text-4xl mb-10" style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}>
            Account
          </h1>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <svg className="animate-spin w-6 h-6" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="var(--color-text-faint)" strokeWidth="3" opacity="0.3" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--color-accent)" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
          ) : (
            <div className="flex flex-col gap-5">

              {/* Subscription card */}
              <div className="rounded-2xl p-6 flex flex-col gap-5" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-medium" style={{ color: "var(--color-text)" }}>Subscription</h2>
                  {sub && (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ background: `${STATUS_COLORS[sub.status]}18`, color: STATUS_COLORS[sub.status] }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {STATUS_LABELS[sub.status]}
                    </div>
                  )}
                </div>

                {sub && isActive ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-xl p-4" style={{ background: "var(--color-surface-raised)" }}>
                        <p className="text-xs mb-1" style={{ color: "var(--color-text-faint)" }}>Plan</p>
                        <p className="text-sm font-medium capitalize" style={{ color: "var(--color-text)" }}>
                          {sub.plan ?? "—"}
                        </p>
                      </div>
                      <div className="rounded-xl p-4" style={{ background: "var(--color-surface-raised)" }}>
                        <p className="text-xs mb-1" style={{ color: "var(--color-text-faint)" }}>Generation credits</p>
                        <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
                          {sub.generationCreditsRemaining} / {sub.generationCreditsIncluded}
                        </p>
                      </div>
                      <div className="rounded-xl p-4" style={{ background: "var(--color-surface-raised)" }}>
                        <p className="text-xs mb-1" style={{ color: "var(--color-text-faint)" }}>
                          {sub.status === "active" ? "Renews" : "Expires"}
                        </p>
                        <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
                          {formatDate(sub.currentPeriodEnd)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button variant="secondary" loading={portalLoading} onClick={handlePortal} className="w-full">
                        Manage subscription
                      </Button>
                      <p className="text-xs text-center" style={{ color: "var(--color-text-faint)" }}>
                        Cancel, update payment method, or view invoices via Stripe.
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col gap-4">
                    <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                      You don&apos;t have an active subscription. Subscribe to unlock generation credits, your library, and downloads.
                    </p>
                    <Link href="/pricing"><Button className="w-full">View pricing</Button></Link>
                  </div>
                )}
              </div>

              {/* Quick links */}
              <div className="rounded-2xl p-6 flex flex-col gap-3" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                <h2 className="text-base font-medium mb-1" style={{ color: "var(--color-text)" }}>Quick access</h2>
                <Link href="/create" className="flex items-center justify-between py-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
                  <span>Create a session</span>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </Link>
                <div className="h-px" style={{ background: "var(--color-border-subtle)" }} />
                <Link href="/library" className="flex items-center justify-between py-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
                  <span>My library</span>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </Link>
              </div>

              {/* Sign out */}
              <div className="pt-2">
                <SignOutButton />
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

function SignOutButton() {
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    const { createBrowserSupabaseClient } = await import("@/lib/supabase-browser");
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <Button variant="ghost" loading={loading} onClick={handleSignOut} className="w-full" style={{ color: "var(--color-text-faint)" }}>
      Sign out
    </Button>
  );
}
