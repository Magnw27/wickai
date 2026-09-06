import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WickAI",
  description: "A modern, provider-agnostic AI workspace.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
