// FILE: apps/web/src/app/layout.tsx
// PURPOSE: Root Next.js layout — providers, fonts, metadata
// DEPENDS ON: next, @tanstack/react-query, globals.css
// LAST UPDATED: F07 - Next.js Frontend Setup

import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

// ─────────────────────────────────────────────
// Font
// ─────────────────────────────────────────────

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// ─────────────────────────────────────────────
// Metadata
// ─────────────────────────────────────────────

export const metadata: Metadata = {
  title: {
    default: "SplitSync",
    template: "%s | SplitSync",
  },
  description:
    "Real-time collaborative expense splitting and settlement engine",
  keywords: [
    "expense splitting",
    "group expenses",
    "bill splitting",
    "settle debts",
  ],
  authors: [{ name: "SplitSync" }],
  creator: "SplitSync",
  // ── Add this ──
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
};

// ─────────────────────────────────────────────
// Root Layout
// ─────────────────────────────────────────────

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}