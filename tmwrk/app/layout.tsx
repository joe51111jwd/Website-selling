import type { Metadata, Viewport } from "next";
import { EB_Garamond, Figtree } from "next/font/google";
import "./globals.css";

const sans = Figtree({ subsets: ["latin"], variable: "--f-sans", weight: ["400", "500", "600", "700"] });
const serif = EB_Garamond({ subsets: ["latin"], variable: "--f-serif", weight: ["400", "500"], style: ["normal", "italic"] });

export const metadata: Metadata = {
  title: "TMWRK",
  description: "Daily Spotify and TikTok alerts for the TMWRK catalog.",
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { themeColor: "#f6f6f4", width: "device-width", initialScale: 1 };

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
