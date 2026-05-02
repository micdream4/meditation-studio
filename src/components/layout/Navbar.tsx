"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/pricing", label: "Pricing" },
];

function getAccountLabel(user: User) {
  const metadata = user.user_metadata;
  const displayName =
    typeof metadata?.full_name === "string" ? metadata.full_name :
    typeof metadata?.name === "string" ? metadata.name :
    null;

  return user.email || displayName?.trim() || "Account";
}

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let ignore = false;
    let authSubscription: { unsubscribe: () => void } | null = null;

    import("@/lib/supabase-browser").then(({ createBrowserSupabaseClient }) => {
      const supabase = createBrowserSupabaseClient();
      supabase.auth.getUser().then(({ data }) => {
        if (!ignore) setUser(data.user);
      });
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!ignore) setUser(session?.user ?? null);
      });
      authSubscription = subscription;
    });
    return () => {
      ignore = true;
      authSubscription?.unsubscribe();
    };
  }, []);

  const accountLabel = user ? getAccountLabel(user) : "Account";

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: "rgba(250,248,245,0.82)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        borderBottom: "1px solid rgba(0,0,0,0.055)",
      }}
    >
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
            style={{ background: "linear-gradient(135deg, #78a07e 0%, #c07a5a 100%)" }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="3" fill="white" opacity="0.9" />
              <circle cx="7" cy="7" r="6" stroke="white" strokeWidth="1.5" opacity="0.4" />
            </svg>
          </div>
          <span
            className="text-[15px] font-medium tracking-tight transition-colors duration-200 group-hover:opacity-80"
            style={{ color: "var(--color-text)" }}
          >
            Meditation Studio
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="nav-link text-sm"
              style={{
                color: pathname === link.href ? "var(--color-text)" : "var(--color-text-muted)",
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Link href="/create" className="nav-link text-sm" style={{ color: "var(--color-text-muted)" }}>Create</Link>
              <Link href="/library" className="nav-link text-sm" style={{ color: "var(--color-text-muted)" }}>Library</Link>
              <Link href="/voice-lab" className="nav-link text-sm" style={{ color: "var(--color-text-muted)" }}>Voice Lab</Link>
              <Link
                href="/account"
                className="max-w-48 truncate text-sm px-5 py-2 rounded-full font-medium transition-all duration-200 hover:opacity-90"
                style={{
                  background: "linear-gradient(140deg, #78a07e 0%, #5a7a60 100%)",
                  color: "#fff",
                  boxShadow: "0 2px 14px rgba(107,143,113,0.32)",
                }}
                title={accountLabel}
              >
                {accountLabel}
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="nav-link text-sm" style={{ color: "var(--color-text-muted)" }}>Sign in</Link>
              <Link
                href="/pricing"
                className="text-sm px-5 py-2 rounded-full font-medium transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                style={{
                  background: "linear-gradient(140deg, #78a07e 0%, #5a7a60 100%)",
                  color: "#fff",
                  boxShadow: "0 2px 14px rgba(107,143,113,0.32)",
                }}
              >
                Start meditating
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-1.5 rounded-lg transition-colors hover:bg-black/5"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <span
            className="block w-5 h-0.5 rounded-full transition-all duration-200"
            style={{ background: "var(--color-text-muted)", transform: menuOpen ? "rotate(45deg) translate(2px, 6px)" : "none" }}
          />
          <span
            className="block w-5 h-0.5 rounded-full transition-all duration-200"
            style={{ background: "var(--color-text-muted)", opacity: menuOpen ? 0 : 1 }}
          />
          <span
            className="block w-5 h-0.5 rounded-full transition-all duration-200"
            style={{ background: "var(--color-text-muted)", transform: menuOpen ? "rotate(-45deg) translate(2px, -6px)" : "none" }}
          />
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="md:hidden px-6 pb-6 pt-3 flex flex-col gap-4"
          style={{ borderTop: "1px solid var(--color-border-subtle)" }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm py-1"
              style={{ color: "var(--color-text-muted)" }}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="flex flex-col gap-2 pt-2">
            {user ? (
              <>
                <Link href="/create" className="text-sm text-center py-2.5 rounded-xl transition-colors" style={{ color: "var(--color-text-muted)", border: "1px solid var(--color-border)" }} onClick={() => setMenuOpen(false)}>Create</Link>
                <Link href="/library" className="text-sm text-center py-2.5 rounded-xl transition-colors" style={{ color: "var(--color-text-muted)", border: "1px solid var(--color-border)" }} onClick={() => setMenuOpen(false)}>Library</Link>
                <Link href="/voice-lab" className="text-sm text-center py-2.5 rounded-xl transition-colors" style={{ color: "var(--color-text-muted)", border: "1px solid var(--color-border)" }} onClick={() => setMenuOpen(false)}>Voice Lab</Link>
                <Link href="/account" className="truncate text-sm text-center py-2.5 px-4 rounded-xl font-medium" style={{ background: "linear-gradient(140deg, #78a07e 0%, #5a7a60 100%)", color: "#fff" }} title={accountLabel} onClick={() => setMenuOpen(false)}>{accountLabel}</Link>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm text-center py-2.5 rounded-xl" style={{ color: "var(--color-text-muted)", border: "1px solid var(--color-border)" }} onClick={() => setMenuOpen(false)}>Sign in</Link>
                <Link href="/pricing" className="text-sm text-center py-2.5 rounded-xl font-medium" style={{ background: "linear-gradient(140deg, #78a07e 0%, #5a7a60 100%)", color: "#fff" }} onClick={() => setMenuOpen(false)}>Start meditating</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
