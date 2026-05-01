import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";
import CuratedTracks from "@/components/home/CuratedTracks";
import QuickStart from "@/components/home/QuickStart";
import { IconWave, IconGrid, IconPen } from "@/components/ui/Icons";

const MOODS = ["Anxious", "Tired", "Can't sleep", "Unfocused", "Low mood"];

const THEMES = [
  { name: "Breathing" },
  { name: "Body Scan" },
  { name: "Sleep Wind-down" },
  { name: "Anxiety Release" },
];

const STEPS = [
  {
    n: "01",
    title: "Tell us how you feel",
    desc: "Answer two quick questions — your current state and how long you have. Or pick a theme and go.",
  },
  {
    n: "02",
    title: "AI writes your script",
    desc: "Our model crafts a personalized meditation script in seconds, shaped exactly for your moment.",
  },
  {
    n: "03",
    title: "High-quality voice + music",
    desc: "ElevenLabs voices the script with natural pacing. Add optional nature sounds only when they help.",
  },
];

const FAQ = [
  {
    q: "How is this different from Calm or Headspace?",
    a: "Those apps have fixed recordings. Meditation Studio generates a new session every time based on how you actually feel right now — anxiety, fatigue, sleeplessness, whatever it is.",
  },
  {
    q: "What voices are available?",
    a: "We offer 4–6 pre-set meditation voices. All subscriptions include access to every voice.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel from your account page with one click. No forms, no emails.",
  },
  {
    q: "Is this therapy or medical advice?",
    a: "No. Meditation Studio is a relaxation and mindfulness tool, not a medical product. If you're in crisis, please contact a mental health professional.",
  },
  {
    q: "Can I download my sessions?",
    a: "Yes — every generated session can be saved to your library and downloaded as an MP3.",
  },
];

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 pt-16">

        {/* ── Hero ── */}
        <section className="relative overflow-hidden">
          {/* Large ambient orb — breathing */}
          <div
            className="animate-orb pointer-events-none absolute"
            style={{
              top: "-100px",
              left: "50%",
              width: "900px",
              height: "900px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(107,143,113,0.12) 0%, rgba(192,122,90,0.05) 40%, transparent 70%)",
            }}
          />
          {/* Secondary orb — right */}
          <div
            className="animate-breathe pointer-events-none absolute"
            style={{
              top: "60px",
              right: "-120px",
              width: "500px",
              height: "500px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(192,122,90,0.08) 0%, transparent 65%)",
              animationDelay: "2s",
            }}
          />

          <div className="max-w-5xl mx-auto px-6 pt-24 pb-20 md:pt-40 md:pb-32 text-center relative">
            <div
              className="animate-fade-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-8"
              style={{ background: "var(--color-accent-muted)", color: "var(--color-accent)", border: "1px solid rgba(107,143,113,0.18)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-breathe" />
              AI-personalized meditation
            </div>

            <h1
              className="animate-fade-up stagger-1 text-5xl md:text-[72px] lg:text-[80px] leading-[1.06] tracking-tight mb-6"
              style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}
            >
              Meditation{" "}
              <span className="gradient-text">made for</span>
              <br />
              <span className="gradient-text">this exact moment.</span>
            </h1>

            <p
              className="animate-fade-up stagger-2 text-lg md:text-xl leading-relaxed max-w-lg mx-auto mb-10"
              style={{ color: "var(--color-text-muted)" }}
            >
              Tell us how you&apos;re feeling. We&apos;ll write a personalized session,
              voice it in studio quality, and have it playing in under 60 seconds.
            </p>

            {/* Mood pills */}
            <div className="animate-fade-up stagger-3 flex flex-wrap justify-center gap-2 mb-10">
              {MOODS.map((mood) => (
                <span
                  key={mood}
                  className="px-4 py-1.5 rounded-full text-sm transition-all duration-200 hover:border-opacity-50 cursor-default"
                  style={{
                    background: "var(--color-surface)",
                    color: "var(--color-text-muted)",
                    border: "1px solid var(--color-border)",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                  }}
                >
                  {mood}
                </span>
              ))}
              <span className="px-4 py-1.5 rounded-full text-sm" style={{ color: "var(--color-text-faint)" }}>
                + more
              </span>
            </div>

            {/* CTAs */}
            <div className="animate-fade-up stagger-4 flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/pricing">
                <Button size="lg">Start meditating — 30 credits/mo</Button>
              </Link>
              <Link href="#curated">
                <Button variant="secondary" size="lg">Listen to examples</Button>
              </Link>
            </div>
            <p className="mt-4 text-xs" style={{ color: "var(--color-text-faint)" }}>
              Cancel anytime · No free tier · Pure quality
            </p>
          </div>
        </section>

        {/* ── Quick start input ── */}
        <QuickStart />

        {/* ── How it works ── */}
        <section className="max-w-5xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <p className="text-xs font-medium tracking-widest uppercase mb-3" style={{ color: "var(--color-accent)" }}>
              How it works
            </p>
            <h2 className="text-3xl md:text-4xl" style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}>
              Three steps to a better state
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {STEPS.map((step) => (
              <div
                key={step.n}
                className="rounded-2xl p-7 flex flex-col gap-5 relative overflow-hidden"
                style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
              >
                {/* Large background number */}
                <span
                  className="absolute -top-4 -right-1 text-[88px] font-bold leading-none select-none pointer-events-none"
                  style={{ color: "rgba(107,143,113,0.07)", fontFamily: "var(--font-display)" }}
                >
                  {step.n}
                </span>
                <span
                  className="relative text-xs font-mono font-semibold tracking-wider"
                  style={{ color: "var(--color-accent)" }}
                >
                  {step.n}
                </span>
                <div className="relative flex flex-col gap-2">
                  <h3 className="text-lg font-medium leading-snug" style={{ color: "var(--color-text)" }}>{step.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-muted)" }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Three modes ── */}
        <section className="py-20" style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-14">
              <p className="text-xs font-medium tracking-widest uppercase mb-3" style={{ color: "var(--color-accent)" }}>
                Three ways to start
              </p>
              <h2 className="text-3xl md:text-4xl" style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}>
                Always the right entry point
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              {/* Mode A — Mood */}
              <Link href="/create?mode=mood" className="group block">
                <div
                  className="card-hover rounded-2xl p-7 flex flex-col gap-5 h-full"
                  style={{
                    background: "linear-gradient(160deg, rgba(107,143,113,0.08) 0%, var(--color-surface) 55%)",
                    border: "1px solid rgba(107,143,113,0.16)",
                  }}
                >
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center"
                    style={{ background: "rgba(107,143,113,0.12)" }}
                  >
                    <IconWave size={22} color="var(--color-accent)" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: "var(--color-accent)" }}>
                      Mood-guided
                    </div>
                    <h3 className="text-xl mb-2" style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}>
                      How are you feeling?
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
                      Answer two questions. The AI shapes a session perfectly matched to your state right now.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
                    {["Anxious", "Tired", "Sleepless"].map((m) => (
                      <span
                        key={m}
                        className="px-2.5 py-1 rounded-full text-xs"
                        style={{ background: "rgba(107,143,113,0.1)", color: "var(--color-accent)" }}
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>

              {/* Mode B — Theme */}
              <Link href="/create?mode=template" className="group block">
                <div
                  className="card-hover rounded-2xl p-7 flex flex-col gap-5 h-full"
                  style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
                >
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center"
                    style={{ background: "rgba(192,122,90,0.1)" }}
                  >
                    <IconGrid size={22} color="var(--color-accent-warm)" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: "var(--color-accent-warm)" }}>
                      Theme templates
                    </div>
                    <h3 className="text-xl mb-2" style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}>
                      Pick a practice
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
                      8 curated themes from breathing to sleep wind-down. Pick one and it&apos;s ready in seconds.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 mt-auto pt-2">
                    {THEMES.map((t) => (
                      <span
                        key={t.name}
                        className="px-3 py-1.5 rounded-xl text-xs"
                        style={{ background: "var(--color-surface-raised)", color: "var(--color-text-muted)", border: "1px solid var(--color-border)" }}
                      >
                        {t.name}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>

              {/* Mode C — Custom */}
              <Link href="/create?mode=custom" className="group block">
                <div
                  className="card-hover rounded-2xl p-7 flex flex-col gap-5 h-full"
                  style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
                >
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center"
                    style={{ background: "rgba(107,143,113,0.07)" }}
                  >
                    <IconPen size={22} color="var(--color-text-muted)" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: "var(--color-text-muted)" }}>
                      Fully custom
                    </div>
                    <h3 className="text-xl mb-2" style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}>
                      Write your own
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
                      Type any intention or visualization. The AI voices it exactly as you wrote it.
                    </p>
                  </div>
                  <div
                    className="mt-auto pt-2 px-4 py-3 rounded-xl text-sm italic leading-relaxed"
                    style={{ background: "var(--color-surface-raised)", color: "var(--color-text-faint)", border: "1px solid var(--color-border-subtle)" }}
                  >
                    &ldquo;A 10-minute session to release tension in my shoulders and jaw…&rdquo;
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* ── Curated tracks ── */}
        <CuratedTracks />

        {/* ── Pricing teaser ── */}
        <section className="py-20" style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
          <div className="max-w-2xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl mb-4" style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}>
              Credit-based pricing, no hidden limits.
            </h2>
            <p className="text-base mb-10" style={{ color: "var(--color-text-muted)" }}>
              1 credit is roughly 1 minute of generated audio · Cloud library · MP3 downloads · All voices
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <div
                className="rounded-2xl px-8 py-6 text-center min-w-[160px] transition-all duration-200 hover:shadow-md"
                style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
              >
                <div className="text-4xl font-bold mb-1" style={{ color: "var(--color-text)", fontFamily: "var(--font-display)" }}>
                  $19
                </div>
                <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>30 credits / month</div>
              </div>
              <div className="text-xs" style={{ color: "var(--color-text-faint)" }}>or</div>
              <div
                className="rounded-2xl px-8 py-6 text-center min-w-[160px] relative transition-all duration-200 hover:shadow-md"
                style={{
                  background: "linear-gradient(145deg, rgba(107,143,113,0.1) 0%, var(--color-surface) 100%)",
                  border: "1px solid rgba(107,143,113,0.22)",
                }}
              >
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-medium"
                  style={{ background: "var(--color-accent)", color: "#fff" }}
                >
                  Better value
                </div>
                <div className="text-4xl font-bold mb-1" style={{ color: "var(--color-text)", fontFamily: "var(--font-display)" }}>
                  $159
                </div>
                <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>300 credits / year</div>
              </div>
            </div>
            <div className="mt-8">
              <Link href="/pricing"><Button size="lg">See full pricing</Button></Link>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="py-20" style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
          <div className="max-w-2xl mx-auto px-6">
            <h2 className="text-3xl mb-10 text-center" style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}>
              Questions
            </h2>
            <div style={{ borderTop: "1px solid var(--color-border)" }}>
              {FAQ.map((item) => (
                <div key={item.q} className="py-6 group" style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <p className="text-base font-medium mb-2 transition-colors" style={{ color: "var(--color-text)" }}>{item.q}</p>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-muted)" }}>{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="relative py-28 overflow-hidden">
          <div
            className="animate-orb pointer-events-none absolute"
            style={{
              top: "50%",
              left: "50%",
              width: "700px",
              height: "700px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(107,143,113,0.09) 0%, transparent 65%)",
              animationDelay: "1.5s",
            }}
          />
          <div className="relative max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-4xl md:text-5xl mb-5" style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}>
              Ready to stop searching for calm?
            </h2>
            <p className="text-base mb-10" style={{ color: "var(--color-text-muted)" }}>
              Your next meditation is 30 seconds away.
            </p>
            <Link href="/pricing"><Button size="lg">Get started today</Button></Link>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
