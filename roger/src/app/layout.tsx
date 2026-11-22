import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@fontsource-variable/mona-sans/wdth.css";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CurrencyProvider } from "@/components/v3/currency";
import { siteConfig } from "@/data/config";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: "Roger: Your AI agents, smarter every Monday", template: "%s · Roger" },
  description:
    "Roger makes your AI agents smarter every week. Three ideas every Monday that worked for other real estate users, each one ready to paste and install.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a href="#main" className="skip">
          Skip to content
        </a>
        <CurrencyProvider>
          <SiteHeader />
          <main id="main">{children}</main>
          <SiteFooter />
        </CurrencyProvider>
      </body>
    </html>
  );
}
