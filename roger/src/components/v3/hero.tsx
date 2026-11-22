import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import type { StartPath } from "@/data/config";
import { cardLine, ctaLong } from "@/data/v3-copy";
import { HeroLoop } from "./hero-loop";
import { StartLink } from "./start-link";

export function Hero({
  headline,
  sub,
  path,
  secondary,
  loop,
  children,
}: {
  headline: string;
  sub: string;
  path: StartPath;
  secondary: { href: string; label: string; button?: boolean };
  loop: { when: string; what: string }[];
  children?: ReactNode;
}) {
  return (
    <section className="hero night" data-tone="night">
      <div className="hero-bg" aria-hidden="true" />
      <div className="wrap" style={{ position: "relative" }}>
        <div className="hero-grid">
          <div>
            <h1 className="t-display" aria-label={headline}>
              {headline.split(" ").map((w, i) => (
                <span key={i} aria-hidden="true">
                  <span className="w" style={{ "--i": i } as CSSProperties}>{w}</span>{" "}
                </span>
              ))}
            </h1>
            <p className="t-lead ink-2 rise" style={{ marginTop: "1.5rem", maxWidth: "31rem", "--d": "0.55s" } as CSSProperties}>
              {sub}
            </p>
            <div className="hero-actions rise" style={{ "--d": "0.7s" } as CSSProperties}>
              <StartLink path={path}>{ctaLong}</StartLink>
              <Link href={secondary.href} className={secondary.button ? "btn btn-ghost" : "link"}>
                {secondary.label} {!secondary.button && <span aria-hidden="true">›</span>}
              </Link>
            </div>
            <p className="t-meta ink-2 rise" style={{ marginTop: "1rem", "--d": "0.8s" } as CSSProperties}>
              {cardLine}
            </p>
          </div>
          <div className="hero-visual rise" style={{ "--d": "0.5s" } as CSSProperties}>
            <HeroLoop labels={loop} />
          </div>
        </div>
        {children}
      </div>
    </section>
  );
}
