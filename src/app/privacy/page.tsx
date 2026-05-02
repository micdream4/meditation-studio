import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata = {
  title: "Privacy Policy — Meditation Studio",
};

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 pt-16">
        <div className="max-w-2xl mx-auto px-6 py-16">
          <h1 className="text-4xl mb-2" style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}>
            Privacy Policy
          </h1>
          <p className="text-sm mb-12" style={{ color: "var(--color-text-faint)" }}>Last updated: May 2026</p>

          <div className="flex flex-col gap-10 text-sm leading-relaxed" style={{ color: "var(--color-text-muted)" }}>

            <section>
              <h2 className="text-base font-medium mb-3" style={{ color: "var(--color-text)" }}>1. Information we collect</h2>
              <p className="mb-3">We collect the minimum information necessary to operate the service:</p>
              <ul className="flex flex-col gap-2 pl-4" style={{ listStyleType: "disc" }}>
                <li><strong style={{ color: "var(--color-text)" }}>Account data</strong> — email address and encrypted password (or OAuth identity if you sign in with Google).</li>
                <li><strong style={{ color: "var(--color-text)" }}>Generation inputs</strong> — the mood, theme, or custom text you provide to generate a session. These are used solely to produce your meditation.</li>
                <li><strong style={{ color: "var(--color-text)" }}>Usage data</strong> — basic session logs (timestamps, generation counts) for rate-limiting and abuse prevention.</li>
                <li><strong style={{ color: "var(--color-text)" }}>Payment data</strong> — handled by Creem as our payment processor and merchant of record. We never see or store your full card number, bank account details, or PayPal credentials.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-medium mb-3" style={{ color: "var(--color-text)" }}>2. How we use your information</h2>
              <ul className="flex flex-col gap-2 pl-4" style={{ listStyleType: "disc" }}>
                <li>To authenticate you and manage your subscription.</li>
                <li>To generate personalized meditation audio on your behalf.</li>
                <li>To store sessions you explicitly save to your library.</li>
                <li>To enforce usage limits and prevent abuse.</li>
              </ul>
              <p className="mt-3">We do not sell your data. We do not use your generation inputs to train AI models.</p>
            </section>

            <section>
              <h2 className="text-base font-medium mb-3" style={{ color: "var(--color-text)" }}>3. Third-party services</h2>
              <p className="mb-3">We use a small number of trusted third-party services to operate:</p>
              <ul className="flex flex-col gap-2 pl-4" style={{ listStyleType: "disc" }}>
                <li><strong style={{ color: "var(--color-text)" }}>Supabase</strong> — database and authentication.</li>
                <li><strong style={{ color: "var(--color-text)" }}>Creem</strong> — checkout, subscription billing, invoices, taxes, and payment method management.</li>
                <li><strong style={{ color: "var(--color-text)" }}>ElevenLabs</strong> — text-to-speech voice synthesis. Your script text is sent to ElevenLabs to generate audio.</li>
                <li><strong style={{ color: "var(--color-text)" }}>OpenRouter</strong> — AI script generation. Your mood/theme input is sent to generate your meditation script.</li>
              </ul>
              <p className="mt-3">Each provider is subject to their own privacy policy and data handling terms.</p>
            </section>

            <section>
              <h2 className="text-base font-medium mb-3" style={{ color: "var(--color-text)" }}>4. Data retention</h2>
              <p>Account data is retained while your account is active. Generated audio files you have not saved are deleted within 30 days. Saved library sessions are retained until you delete them or close your account. Payment and tax records are retained by Creem according to legal and compliance requirements.</p>
            </section>

            <section>
              <h2 className="text-base font-medium mb-3" style={{ color: "var(--color-text)" }}>5. Your rights</h2>
              <p>You may request deletion of your account and associated data at any time by contacting us. Creem payment records are subject to legal retention requirements and are managed by Creem directly.</p>
            </section>

            <section>
              <h2 className="text-base font-medium mb-3" style={{ color: "var(--color-text)" }}>6. AI processing</h2>
              <p>Your prompts and generated scripts may be sent to our AI and voice providers only to produce the meditation session you request. We do not use your generation inputs to train our own models, and we do not sell generated text or audio inputs to third parties.</p>
            </section>

            <section>
              <h2 className="text-base font-medium mb-3" style={{ color: "var(--color-text)" }}>7. Cookies</h2>
              <p>We use only functional cookies necessary to maintain your session. We do not use advertising or tracking cookies.</p>
            </section>

            <section>
              <h2 className="text-base font-medium mb-3" style={{ color: "var(--color-text)" }}>8. Changes to this policy</h2>
              <p>We may update this policy periodically. We will notify you of material changes via email or a notice on the site.</p>
            </section>

            <section>
              <h2 className="text-base font-medium mb-3" style={{ color: "var(--color-text)" }}>9. Contact</h2>
              <p>Privacy questions or data requests: <span style={{ color: "var(--color-accent)" }}>micdream4@gmail.com</span>.</p>
            </section>
          </div>

          <div className="mt-14 pt-8" style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
            <Link href="/terms" className="text-sm" style={{ color: "var(--color-accent)" }}>Terms of Service →</Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
