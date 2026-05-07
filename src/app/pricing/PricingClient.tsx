"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";
import type { SubscriptionPlan } from "@/types/api";

type PublicPlan = {
  id: "basic" | "plus" | "pro";
  name: string;
  priceUsd: number;
  credits: number;
  description: string;
  highlight?: boolean;
};

const PLAN_COPY: PublicPlan[] = [
  {
    id: "basic",
    name: "Basic",
    priceUsd: 9.9,
    credits: 30,
    description: "Light personal use, short weekly sessions.",
  },
  {
    id: "plus",
    name: "Plus",
    priceUsd: 19.9,
    credits: 75,
    description: "Best for a regular meditation routine.",
    highlight: true,
  },
  {
    id: "pro",
    name: "Pro",
    priceUsd: 29.9,
    credits: 120,
    description: "More room for longer sessions and re-generations.",
  },
];

const FEATURES = [
  { icon: "◷", label: "1 credit = about 1 generated audio minute" },
  { icon: "◈", label: "All 3 creation modes — Mood, Theme, Custom" },
  { icon: "◎", label: "Meditation-ready AI voices" },
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
    q: "How do credits work?",
    a: "One credit roughly equals one minute of generated audio. A 10-minute session uses 10 credits. Re-generating the same script with a different voice also uses credits because it runs TTS again.",
  },
  {
    q: "Which plan should I choose?",
    a: "Basic is enough for occasional short sessions. Plus is the default choice for a regular routine. Pro is for longer sessions or frequent voice re-generations.",
  },
  {
    q: "What payment methods do you accept?",
    a: "Payments are processed securely through Creem. We never see or store your card details.",
  },
  {
    q: "Is there a free trial?",
    a: "No free tier for personalized generation, but you can listen to all 8 curated guided sessions on the homepage to get a feel for the audio quality.",
  },
];

function formatPrice(price: number) {
  return `$${price.toLocaleString("en-US", {
    minimumFractionDigits: price % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 2,
  })}`;
}

function getPlanPrice(plan: PublicPlan, prices: Record<PublicPlan["id"], number>) {
  return prices[plan.id] ?? plan.priceUsd;
}

export default function PricingClient({
  availablePlans,
  isTestCheckout,
  planPricesUsd,
}: {
  availablePlans: Array<Exclude<SubscriptionPlan, null>>;
  isTestCheckout: boolean;
  planPricesUsd: Record<PublicPlan["id"], number>;
}) {
  const [loading, setLoading] = useState<PublicPlan["id"] | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const plusUnavailable = !isTestCheckout && !availablePlans.includes("plus");

  async function handleCheckout(plan: PublicPlan["id"]) {
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
          <div className="max-w-3xl mx-auto px-6 pt-24 pb-12 text-center relative">
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
              Choose the rhythm that fits.
            </h1>
            <p
              className="animate-fade-up stagger-2 text-lg leading-relaxed"
              style={{ color: "var(--color-text-muted)" }}
            >
              Personalized meditation audio priced by real generation usage.
              <br />
              More credits mean more minutes, longer sessions, and more room to retry voices.
            </p>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 pb-20">
          {isTestCheckout && (
            <div
              className="max-w-2xl mx-auto mb-8 text-center text-xs px-4 py-3 rounded-2xl"
              style={{ background: "rgba(192,122,90,0.1)", color: "var(--color-accent-warm)", border: "1px solid rgba(192,122,90,0.16)" }}
            >
              Test mode is enabled. Checkout will use the configured Creem test product.
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-3">
            {PLAN_COPY.map((plan) => {
              const unavailable = !isTestCheckout && !availablePlans.includes(plan.id);
              const price = getPlanPrice(plan, planPricesUsd);
              return (
                <div
                  key={plan.id}
                  className="relative rounded-2xl p-6 flex flex-col min-h-[420px]"
                  style={{
                    background: "var(--color-surface)",
                    border: plan.highlight ? "1px solid rgba(107,143,113,0.45)" : "1px solid var(--color-border)",
                    boxShadow: plan.highlight ? "0 18px 50px rgba(107,143,113,0.14)" : "none",
                  }}
                >
                  {plan.highlight && (
                    <div
                      className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs px-3 py-1 rounded-full font-medium"
                      style={{ background: "var(--color-accent)", color: "#fff" }}
                    >
                      Recommended
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-3 mb-5">
                    <div>
                      <h2 className="text-xl font-medium" style={{ color: "var(--color-text)" }}>
                        {plan.name}
                      </h2>
                      <p className="text-sm mt-1 min-h-[42px]" style={{ color: "var(--color-text-muted)" }}>
                        {plan.description}
                      </p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-end gap-1">
                      <span
                        className="text-5xl leading-none font-bold tracking-tight"
                        style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}
                      >
                        {formatPrice(price)}
                      </span>
                      <span className="pb-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
                        /month
                      </span>
                    </div>
                    <div className="text-sm mt-3" style={{ color: "var(--color-text-muted)" }}>
                      <span className="font-medium" style={{ color: "var(--color-text)" }}>{plan.credits}</span>{" "}
                      credits included each month
                    </div>
                  </div>

                  <div className="rounded-2xl p-4 mb-6" style={{ background: "var(--color-surface-raised)" }}>
                    <div className="text-xs mb-2" style={{ color: "var(--color-text-faint)" }}>
                      Typical use
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="font-medium" style={{ color: "var(--color-text)" }}>
                          {Math.floor(plan.credits / 10)}×
                        </div>
                        <div style={{ color: "var(--color-text-muted)" }}>10-min sessions</div>
                      </div>
                      <div>
                        <div className="font-medium" style={{ color: "var(--color-text)" }}>
                          {Math.floor(plan.credits / 15)}×
                        </div>
                        <div style={{ color: "var(--color-text-muted)" }}>15-min sessions</div>
                      </div>
                    </div>
                  </div>

                  <ul className="flex flex-col gap-3 mb-6 text-sm" style={{ color: "var(--color-text-muted)" }}>
                    <li className="flex gap-2">
                      <span style={{ color: "var(--color-accent)" }}>✓</span>
                      All generation modes
                    </li>
                    <li className="flex gap-2">
                      <span style={{ color: "var(--color-accent)" }}>✓</span>
                      AI voice + optional background sound
                    </li>
                    <li className="flex gap-2">
                      <span style={{ color: "var(--color-accent)" }}>✓</span>
                      Cloud library and MP3 downloads
                    </li>
                  </ul>

                  <div className="mt-auto">
                    <Button
                      size="lg"
                      variant={plan.highlight ? "primary" : "secondary"}
                      loading={loading === plan.id}
                      disabled={unavailable}
                      onClick={() => handleCheckout(plan.id)}
                      className="w-full text-base"
                    >
                      {unavailable ? "Coming soon" : `Start ${plan.name}`}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {checkoutError && (
            <p className="max-w-xl mx-auto mt-5 text-xs text-center px-3 py-2 rounded-xl" style={{ background: "rgba(192,84,74,0.08)", color: "var(--color-error)", border: "1px solid rgba(192,84,74,0.18)" }}>
              {checkoutError}
            </p>
          )}

          <div className="flex items-center justify-center gap-5 text-xs mt-6" style={{ color: "var(--color-text-faint)" }}>
            <span>✓ Cancel anytime</span>
            <span>▣ Secure via Creem</span>
            <span>ⓘ No hidden fees</span>
          </div>

          <div className="my-14 flex items-center gap-4">
            <div className="flex-1 h-px" style={{ background: "var(--color-border)" }} />
            <span className="text-xs tracking-widest uppercase" style={{ color: "var(--color-text-faint)" }}>Included in every plan</span>
            <div className="flex-1 h-px" style={{ background: "var(--color-border)" }} />
          </div>

          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {FEATURES.map((f) => (
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
              Start with the plan<br />that matches your rhythm.
            </h2>
            <p className="text-sm mb-8" style={{ color: "var(--color-text-muted)" }}>
              Already have an account?{" "}
              <Link href="/login" className="nav-link" style={{ color: "var(--color-accent)" }}>Sign in →</Link>
            </p>
            <Button
              size="lg"
              loading={loading === "plus"}
              disabled={plusUnavailable}
              onClick={() => handleCheckout("plus")}
            >
              {plusUnavailable ? "Plus coming soon" : "Start Plus — 75 credits"}
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
