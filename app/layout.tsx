import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./wick-overrides.css";
import "./wick-v4.css";

export const metadata: Metadata = {
  title: "WickAI — AI Workspace",
  description: "A focused, open-source AI workspace built with Next.js and the Vercel AI SDK.",
  applicationName: "WickAI",
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0b0c0f",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
