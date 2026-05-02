"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";

const FEATURES = [
  { icon: "◷", label: "Monthly: 30 generation credits" },
  { icon: "◴", label: "Yearly: 300 generation credits" },
  { icon: "◈", label: "All 3 creation modes — Mood, Theme, Custom" },
  { icon: "◎", label: "4–6 professional meditation voices" },
  { icon: "♩", label: "Optional nature background sounds" },
  { icon: "○", label: "Cloud library — save up to 20 sessions" },
  { icon: "↓", label: "MP3 download for every session" },
  { icon: "▷", label: "Access to 8 curated guided sessions" },
  { icon: "×", label: "Cancel anytime — no forms, no emails" },
];

const FAQ = [
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel from your account page. Your access and remaining credits continue until the end of the paid billing period.",
  },
  {
    q: "Do you offer refunds?",
    a: "We don't offer refunds for partial months, but you can cancel before your next billing date to avoid future charges.",
  },
  {
    q: "What payment methods do you accept?",
    a: "Payments are processed securely through Creem. We never see or store your card details.",
  },
  {
    q: "Is there a free trial?",
    a: "No free tier for personalized generation, but you can listen to all 8 curated guided sessions on the homepage to get a feel for the audio quality.",
  },
  {
    q: "How do credits work?",
    a: "One credit roughly equals one minute of generated audio. A 10-minute session uses 10 credits. Re-generating the same script with a different voice also uses credits because it runs TTS again.",
  },
];

type BillingPlan = "monthly" | "yearly";

export default function PricingClient({ isTestCheckout }: { isTestCheckout: boolean }) {
  const [billing, setBilling] = useState<BillingPlan>("yearly");
  const [loading, setLoading] = useState<BillingPlan | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const checkoutPlan: BillingPlan = isTestCheckout ? "monthly" : billing;
  const features = isTestCheckout
    ? FEATURES.filter((feature) => !feature.label.startsWith("Yearly:"))
    : FEATURES;

  async function handleCheckout(plan: BillingPlan) {
    setLoading(plan);
    setCheckoutError(null);
    try {
      const res = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, returnUrl: window.location.origin + "/create" }),
      });
      const json = await res.json();
      if (json.success) {
        window.location.href = json.data.checkoutUrl;
      } else if (json.error?.code === "unauthorized") {
        window.location.href = `/signup?plan=${plan}`;
      } else {
        setCheckoutError(json.error?.message ?? "Checkout is unavailable right now.");
      }
    } catch {
      setCheckoutError("Checkout is unavailable right now. Please try again later.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 pt-16">

        {/* ── Hero ── */}
        <section className="relative overflow-hidden">
          <div
            className="animate-orb pointer-events-none absolute"
            style={{
              top: "-80px",
              left: "50%",
              width: "700px",
              height: "700px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(107,143,113,0.11) 0%, rgba(192,122,90,0.04) 45%, transparent 70%)",
            }}
          />
          <div className="max-w-3xl mx-auto px-6 pt-24 pb-16 text-center relative">
            <div
              className="animate-fade-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-7"
              style={{ background: "var(--color-accent-muted)", color: "var(--color-accent)", border: "1px solid rgba(107,143,113,0.18)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              Credit-based · Cost controlled
            </div>
            <h1
              className="animate-fade-up stagger-1 text-5xl md:text-[66px] leading-[1.05] tracking-tight mb-5"
              style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}
            >
              Pay for{" "}
              <span className="gradient-text">real usage</span>.
            </h1>
            <p
              className="animate-fade-up stagger-2 text-lg leading-relaxed"
              style={{ color: "var(--color-text-muted)" }}
            >
              AI voice generation has real per-minute cost.
              <br />
              Credits keep pricing fair without hidden unlimited limits.
            </p>
          </div>
        </section>

        {/* ── Billing toggle + Cards ── */}
        <section className="max-w-xl mx-auto px-6 pb-20">

          {!isTestCheckout && (
            <div className="flex justify-center mb-10">
              <div
                className="relative grid grid-cols-2 items-center p-1 rounded-full text-sm w-[320px] max-w-full"
                style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
              >
                <div
                  className="absolute top-1 bottom-1 rounded-full transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"
                  style={{
                    background: "linear-gradient(135deg, #78a07e 0%, #5a7a60 100%)",
                    boxShadow: "0 2px 10px rgba(107,143,113,0.3)",
                    left: billing === "monthly" ? "4px" : "calc(50% + 2px)",
                    width: "calc(50% - 6px)",
                  }}
                />
                {(["monthly", "yearly"] as const).map((b) => (
                  <button
                    key={b}
                    onClick={() => setBilling(b)}
                    className="relative z-10 py-2 rounded-full font-medium transition-colors duration-200 text-center"
                    style={{ color: billing === b ? "#fff" : "var(--color-text-muted)" }}
                  >
                    {b === "monthly" ? "Monthly" : "Yearly"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Price display */}
          <div className="text-center mb-10">
            {isTestCheckout && (
              <div
                className="inline-block mb-3 text-xs px-3 py-1 rounded-full font-medium"
                style={{ background: "rgba(192,122,90,0.1)", color: "var(--color-accent-warm)" }}
              >
                Test checkout · $1/month
              </div>
            )}
            <div className="flex items-end justify-center gap-2">
              <span
                className="text-[76px] leading-none font-bold tracking-tight transition-all duration-300"
                style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}
              >
                {isTestCheckout ? "$1" : billing === "monthly" ? "$19" : "$159"}
              </span>
              <div className="pb-3 text-left">
                <div className="text-sm font-medium" style={{ color: "var(--color-text-muted)" }}>
                  {isTestCheckout ? "/month test" : billing === "monthly" ? "/month" : "/year"}
                </div>
                {!isTestCheckout && billing === "yearly" && (
                  <div className="text-xs" style={{ color: "var(--color-text-faint)" }}>$13.25/mo equivalent</div>
                )}
              </div>
            </div>
            {!isTestCheckout && billing === "yearly" && (
              <div
                className="inline-block mt-2 text-xs px-3 py-1 rounded-full font-medium"
                style={{ background: "rgba(107,143,113,0.1)", color: "var(--color-accent)" }}
              >
                300 credits included each year
              </div>
            )}
            {(isTestCheckout || billing === "monthly") && (
              <div className="mt-2 text-xs" style={{ color: "var(--color-text-faint)" }}>
                30 credits included each month
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="flex flex-col gap-3">
            <Button
              size="lg"
              loading={loading === checkoutPlan}
              onClick={() => handleCheckout(checkoutPlan)}
              className="w-full text-base"
            >
              {isTestCheckout
                ? "Test checkout — $1/month"
                : billing === "yearly"
                  ? "Start — 300 credits/year"
                  : "Start — 30 credits/month"}
            </Button>
            {checkoutError && (
              <p className="text-xs text-center px-3 py-2 rounded-xl" style={{ background: "rgba(192,84,74,0.08)", color: "var(--color-error)", border: "1px solid rgba(192,84,74,0.18)" }}>
                {checkoutError}
              </p>
            )}
            <div className="flex items-center justify-center gap-5 text-xs" style={{ color: "var(--color-text-faint)" }}>
              <span className="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Cancel anytime
              </span>
              <span className="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <rect x="1.5" y="4" width="9" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M4 4V3a2 2 0 114 0v1" stroke="currentColor" strokeWidth="1.2"/>
                </svg>
                Secure via Creem
              </span>
              <span className="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M6 4v3.5M6 8.5v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                No hidden fees
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="my-14 flex items-center gap-4">
            <div className="flex-1 h-px" style={{ background: "var(--color-border)" }} />
            <span className="text-xs tracking-widest uppercase" style={{ color: "var(--color-text-faint)" }}>Included</span>
            <div className="flex-1 h-px" style={{ background: "var(--color-border)" }} />
          </div>

          {/* Features */}
          <ul className="grid grid-cols-1 gap-3">
            {features.map((f) => (
              <li
                key={f.label}
                className="flex items-center gap-4 p-4 rounded-2xl"
                style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-mono"
                  style={{ background: "var(--color-surface-raised)", color: "var(--color-accent)" }}
                >
                  {f.icon}
                </div>
                <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>{f.label}</span>
              </li>
            ))}
          </ul>

          <p className="text-xs text-center mt-8" style={{ color: "var(--color-text-faint)" }}>
            Not medical advice. Meditation Studio is a relaxation tool.
          </p>
        </section>

        {/* ── FAQ ── */}
        <section className="py-16" style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
          <div className="max-w-2xl mx-auto px-6">
            <h2
              className="text-3xl mb-10 text-center"
              style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}
            >
              Questions
            </h2>
            <div style={{ borderTop: "1px solid var(--color-border)" }}>
              {FAQ.map((item, i) => (
                <div key={item.q} style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <button
                    className="w-full flex items-center justify-between gap-4 py-5 text-left transition-colors duration-150"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span className="text-sm font-medium" style={{ color: "var(--color-text)" }}>{item.q}</span>
                    <svg
                      width="16" height="16" viewBox="0 0 16 16" fill="none"
                      className="flex-shrink-0 transition-transform duration-250"
                      style={{
                        color: "var(--color-text-faint)",
                        transform: openFaq === i ? "rotate(180deg)" : "rotate(0deg)",
                      }}
                    >
                      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  {openFaq === i && (
                    <p className="pb-5 text-sm leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
                      {item.a}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Bottom CTA ── */}
        <section className="relative py-24 overflow-hidden">
          <div
            className="animate-orb pointer-events-none absolute"
            style={{
              top: "50%",
              left: "50%",
              width: "600px",
              height: "600px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(107,143,113,0.08) 0%, transparent 65%)",
            }}
          />
          <div className="relative max-w-lg mx-auto px-6 text-center">
            <h2
              className="text-3xl md:text-4xl mb-4"
              style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}
            >
              Your first session is<br />one credit choice away.
            </h2>
            <p className="text-sm mb-8" style={{ color: "var(--color-text-muted)" }}>
              Already have an account?{" "}
              <Link href="/login" className="nav-link" style={{ color: "var(--color-accent)" }}>Sign in →</Link>
            </p>
            <Button size="lg" loading={loading === checkoutPlan} onClick={() => handleCheckout(checkoutPlan)}>
              {isTestCheckout
                ? "Test checkout — $1/month"
                : billing === "yearly"
                  ? "Start yearly — 300 credits"
                  : "Start monthly — 30 credits"}
            </Button>
            {checkoutError && (
              <p className="text-xs text-center mt-3 px-3 py-2 rounded-xl" style={{ background: "rgba(192,84,74,0.08)", color: "var(--color-error)", border: "1px solid rgba(192,84,74,0.18)" }}>
                {checkoutError}
              </p>
            )}
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
