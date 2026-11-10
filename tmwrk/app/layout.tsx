import type { Metadata, Viewport } from "next";
import { Inter_Tight, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const sans = Inter_Tight({ subsets: ["latin"], variable: "--f-sans", weight: ["400", "500", "600", "700", "800"] });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--f-mono", weight: ["400", "500", "700"] });

export const metadata: Metadata = {
  title: "TMWRK — Roster Intelligence",
  description: "Watches the catalog on Spotify and TikTok and tells the team when a track deserves attention.",
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { themeColor: "#0d0d0f", width: "device-width", initialScale: 1 };

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
