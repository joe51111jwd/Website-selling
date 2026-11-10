import type { Metadata, Viewport } from "next";
import { Instrument_Sans } from "next/font/google";
import "./globals.css";

const sans = Instrument_Sans({ subsets: ["latin"], variable: "--f-sans", weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "TMWRK",
  description: "Daily Spotify and TikTok alerts for the TMWRK catalog.",
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { themeColor: "#f6f6f3", width: "device-width", initialScale: 1 };

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={sans.variable}>
      <body>{children}</body>
    </html>
  );
}
