import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./wick.css";
import "./wick-motion.css";
import "./wick-editorial.css";

export const metadata: Metadata = {
  title: "WickAI — AI Workspace",
  description: "A focused AI workspace for developers, makers and curious minds.",
  applicationName: "WickAI",
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#f5f5f2",
  colorScheme: "light",
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
