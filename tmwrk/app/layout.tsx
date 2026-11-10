import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";

const sans = Archivo({ subsets: ["latin"], variable: "--f-sans", weight: ["400", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "TMWRK | Roster Intelligence",
  description: "Daily Spotify and TikTok alerts for the TMWRK catalog.",
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { themeColor: "#ffffff", width: "device-width", initialScale: 1 };

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={sans.variable}>
      <body>{children}</body>
    </html>
  );
}
