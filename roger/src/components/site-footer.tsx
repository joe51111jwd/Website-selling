import Link from "next/link";
import { siteConfig } from "@/data/config";
import { Mark } from "./v3/mark";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="cols">
          <div>
            <Link href="/" className="brand">
              <Mark />
              Roger
            </Link>
            <p className="ink-2" style={{ marginTop: "1rem" }}>
              <a className="link" href={`mailto:${siteConfig.contactEmail}`}>
                {siteConfig.contactEmail}
              </a>
            </p>
          </div>
          <ul>
            <li><Link href="/how-it-works">How it works</Link></li>
            <li><Link href="/pricing">Pricing</Link></li>
            <li><Link href="/faq">FAQ</Link></li>
          </ul>
          <ul>
            <li><Link href="/about">About</Link></li>
            <li><Link href="/library">Use cases</Link></li>
            <li><Link href="/agents">For people who run AI agents</Link></li>
          </ul>
          <ul>
            <li><Link href="/privacy">Privacy</Link></li>
            <li><Link href="/terms">Terms</Link></li>
          </ul>
        </div>
        <p className="t-meta ink-2" style={{ marginTop: "3rem" }}>
          {siteConfig.name}, {siteConfig.city}
        </p>
      </div>
    </footer>
  );
}
