import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Instrument_Sans } from "next/font/google";
import "./globals.css";

const sans = Instrument_Sans({ subsets: ["latin"], variable: "--f-sans", weight: ["400", "500", "600", "700"] });
const mono = IBM_Plex_Mono({ subsets: ["latin"], variable: "--f-mono", weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: "TMWRK | Roster Intelligence",
  description: "Daily Spotify and TikTok alerts for the TMWRK catalog.",
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { themeColor: "#f4f3ee", width: "device-width", initialScale: 1 };

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
