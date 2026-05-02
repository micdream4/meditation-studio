import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata = {
  title: "Terms of Service — Meditation Studio",
};

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 pt-16">
        <div className="max-w-2xl mx-auto px-6 py-16">
          <h1 className="text-4xl mb-2" style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}>
            Terms of Service
          </h1>
          <p className="text-sm mb-12" style={{ color: "var(--color-text-faint)" }}>Last updated: May 2026</p>

          <div className="flex flex-col gap-10 text-sm leading-relaxed" style={{ color: "var(--color-text-muted)" }}>

            <section>
              <h2 className="text-base font-medium mb-3" style={{ color: "var(--color-text)" }}>1. Acceptance of terms</h2>
              <p>By creating an account or using Meditation Studio, you agree to these Terms of Service. If you do not agree, please do not use the service.</p>
            </section>

            <section>
              <h2 className="text-base font-medium mb-3" style={{ color: "var(--color-text)" }}>2. Description of service</h2>
              <p>Meditation Studio is a subscription-based web application that uses AI to generate personalized guided meditation audio. It is a relaxation and mindfulness tool only — it is not a medical device, therapy service, or mental health treatment.</p>
            </section>

            <section>
              <h2 className="text-base font-medium mb-3" style={{ color: "var(--color-text)" }}>3. Subscriptions and billing</h2>
              <p>Access to personalized generation requires a paid subscription. Our current monthly plan is $19/month and includes 30 generation credits each billing period. Subscriptions renew automatically unless canceled. Payments, invoices, taxes, and payment method updates are processed by Creem.</p>
            </section>

            <section>
              <h2 className="text-base font-medium mb-3" style={{ color: "var(--color-text)" }}>4. Cancellation and refunds</h2>
              <p>You may cancel your subscription at any time from your account page. Access continues until the end of the paid billing period. We do not offer refunds for partial billing periods, unused credits, or generated audio, except where required by law or handled directly by Creem under applicable payment rules.</p>
            </section>

            <section>
              <h2 className="text-base font-medium mb-3" style={{ color: "var(--color-text)" }}>5. Your account</h2>
              <p>You are responsible for maintaining the security of your account credentials. You may not share your account with others or use the service for commercial redistribution of generated content.</p>
            </section>

            <section>
              <h2 className="text-base font-medium mb-3" style={{ color: "var(--color-text)" }}>6. Generated content</h2>
              <p>Audio sessions you generate are for your personal use. We grant you a non-exclusive license to use, download, and keep generated sessions. We retain rights to the application, prompts, workflows, voice settings, and music tracks. You are responsible for any text you submit for generation.</p>
            </section>

            <section>
              <h2 className="text-base font-medium mb-3" style={{ color: "var(--color-text)" }}>7. Acceptable use</h2>
              <p>You agree not to use the service to generate content that is harmful, unlawful, or violates the rights of others. We reserve the right to terminate accounts that abuse the service.</p>
            </section>

            <section>
              <h2 className="text-base font-medium mb-3" style={{ color: "var(--color-text)" }}>8. Not medical advice</h2>
              <p>Meditation Studio is a relaxation and mindfulness product only. It is not medical advice, therapy, diagnosis, or treatment. If you are in crisis, please contact a qualified mental health professional, emergency service, or crisis helpline in your area.</p>
            </section>

            <section>
              <h2 className="text-base font-medium mb-3" style={{ color: "var(--color-text)" }}>9. Service availability</h2>
              <p>Generated scripts and audio depend on third-party AI, voice, storage, authentication, and payment providers. We work to keep the service available, but temporary interruptions, delays, or generation failures may occur.</p>
            </section>

            <section>
              <h2 className="text-base font-medium mb-3" style={{ color: "var(--color-text)" }}>10. Limitation of liability</h2>
              <p>To the fullest extent permitted by law, Meditation Studio and its operators shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service.</p>
            </section>

            <section>
              <h2 className="text-base font-medium mb-3" style={{ color: "var(--color-text)" }}>11. Changes to terms</h2>
              <p>We may update these terms from time to time. Continued use of the service after changes constitutes acceptance of the updated terms.</p>
            </section>

            <section>
              <h2 className="text-base font-medium mb-3" style={{ color: "var(--color-text)" }}>12. Contact</h2>
              <p>Questions about these terms? Email us at <span style={{ color: "var(--color-accent)" }}>micdream4@gmail.com</span>.</p>
            </section>
          </div>

          <div className="mt-14 pt-8" style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
            <Link href="/privacy" className="text-sm" style={{ color: "var(--color-accent)" }}>Privacy Policy →</Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
