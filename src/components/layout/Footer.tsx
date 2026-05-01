import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto" style={{ borderTop: "1px solid var(--color-border)" }}>
      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="flex flex-col md:flex-row justify-between gap-10">

          {/* Brand */}
          <div className="flex flex-col gap-4 max-w-xs">
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #78a07e 0%, #c07a5a 100%)" }}
              >
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="3" fill="white" opacity="0.9" />
                  <circle cx="7" cy="7" r="6" stroke="white" strokeWidth="1.5" opacity="0.4" />
                </svg>
              </div>
              <span className="text-sm font-medium" style={{ color: "var(--color-text)" }}>Meditation Studio</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-faint)", lineHeight: "1.7" }}>
              AI-generated meditation tailored to your moment.<br />Not medical advice.
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-14 text-sm">
            <div className="flex flex-col gap-3">
              <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--color-text-faint)" }}>
                Product
              </span>
              {[
                { href: "/pricing", label: "Pricing" },
                { href: "/create",  label: "Create" },
                { href: "/library", label: "My Library" },
              ].map(({ href, label }) => (
                <Link key={href} href={href} className="nav-link w-fit" style={{ color: "var(--color-text-muted)" }}>
                  {label}
                </Link>
              ))}
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--color-text-faint)" }}>
                Account
              </span>
              {[
                { href: "/login",   label: "Sign in" },
                { href: "/signup",  label: "Sign up" },
                { href: "/account", label: "Settings" },
              ].map(({ href, label }) => (
                <Link key={href} href={href} className="nav-link w-fit" style={{ color: "var(--color-text-muted)" }}>
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div
          className="mt-10 pt-6 flex flex-col sm:flex-row justify-between gap-3 text-xs"
          style={{ borderTop: "1px solid var(--color-border-subtle)", color: "var(--color-text-faint)" }}
        >
          <span>© {new Date().getFullYear()} Meditation Studio. All rights reserved.</span>
          <div className="flex gap-5">
            <Link href="/privacy" className="nav-link w-fit">Privacy</Link>
            <Link href="/terms"   className="nav-link w-fit">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
