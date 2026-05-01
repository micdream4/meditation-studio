import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

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
  title: "Meditation Studio — AI-Guided Meditation",
  description:
    "Tell us how you feel. We'll create a personalized meditation just for you — voiced, scored, and ready in seconds.",
  openGraph: {
    title: "Meditation Studio",
    description: "AI-generated meditation, tailored to your moment.",
    type: "website",
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
