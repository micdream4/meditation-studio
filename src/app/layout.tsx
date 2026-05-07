import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.meditationstudio.live";

const inter = localFont({
  variable: "--font-inter",
  display: "swap",
  src: [
    {
      path: "../../public/fonts/inter-400.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/inter-500.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/inter-600.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/inter-700.ttf",
      weight: "700",
      style: "normal",
    },
  ],
});

const dmSerifDisplay = localFont({
  variable: "--font-dm-serif",
  display: "swap",
  src: [
    {
      path: "../../public/fonts/dm-serif-display-400.ttf",
      weight: "400",
      style: "normal",
    },
  ],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Meditation Studio — AI-Guided Meditation",
    template: "%s — Meditation Studio",
  },
  description:
    "Tell us how you feel. We'll create a personalized meditation just for you — voiced, scored, and ready in seconds.",
  keywords: [
    "AI meditation",
    "guided meditation",
    "personalized meditation",
    "meditation audio",
    "sleep meditation",
    "anxiety meditation",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Meditation Studio",
    description: "AI-generated meditation, tailored to your moment.",
    url: siteUrl,
    siteName: "Meditation Studio",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Meditation Studio",
    description: "AI-generated meditation, tailored to your moment.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${dmSerifDisplay.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
