import Link from "next/link";
import type { StartPath } from "@/data/config";
import { clearedTestimonials, ctaLong, faqs, libraryBand, trialLine, type FaqAudience } from "@/data/v3-copy";
import { BrickStack } from "./bricks";
import { PriceBlock } from "./price-block";
import { Questions } from "./questions";
import { Reveal } from "./reveal";
import { StartLink } from "./start-link";

export function PriceChapter({ path }: { path?: StartPath }) {
  return (
    <section className="chapter night" data-tone="night" id="price">
      <PriceBlock path={path} />
    </section>
  );
}

export function QuestionsChapter({ audience }: { audience: FaqAudience }) {
  return (
    <section className="chapter ground" data-tone="ground" id="questions">
      <div className="wrap">
        <div className="narrow" style={{ marginInline: "auto", maxWidth: "46rem" }}>
          <h2 className="t-h2" style={{ marginBottom: "2.5rem" }}>Questions</h2>
          <Questions items={faqs.filter((f) => f.on.includes(audience))} />
          <p style={{ marginTop: "2rem" }}>
            <Link href="/faq" className="link">Every question <span aria-hidden="true">›</span></Link>
          </p>
        </div>
      </div>
    </section>
  );
}

export function ClosingBand({ line, path }: { line: string; path?: StartPath }) {
  return (
    <section className="chapter night closing" data-tone="night">
      <div className="wrap">
        <Reveal>
          <h2 className="t-display" style={{ maxWidth: "52rem", marginInline: "auto" }}>{line}</h2>
          <div style={{ marginTop: "2.5rem" }}><StartLink path={path}>{ctaLong}</StartLink></div>
          <p className="t-meta ink-2 trial">{trialLine}</p>
        </Reveal>
        <div className="closing-bricks" aria-hidden="true"><BrickStack weeks={27} size={18} gap={5} /></div>
      </div>
    </section>
  );
}

/** Absent when no quote is cleared. A simple column; no carousel. */
export function Testimonials({ audience }: { audience: "re" | "agents" }) {
  const rows = clearedTestimonials.filter((t) => t.audience === audience || t.audience === "both").sort((a, b) => a.position - b.position);
  if (!rows.length) return null;
  return (
    <section className="chapter ground" data-tone="ground">
      <div className="wrap">
        <h2 className="t-h2 center-head">What people say</h2>
        <div className="narrow" style={{ margin: "3rem auto 0", display: "grid", gap: "2.5rem" }}>
          {rows.map((t) => (
            <figure key={t.quote}>
              <blockquote className="t-h3" style={{ fontWeight: 560 }}>&ldquo;{t.quote}&rdquo;</blockquote>
              <figcaption className="ink-2" style={{ marginTop: "1rem" }}>{t.name}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/** The band that goes above the footer of the existing /library page (spec A.12). */
export function LibraryBand() {
  return (
    <section className="chapter night closing" data-tone="night">
      <div className="wrap">
        <h2 className="t-h2" style={{ maxWidth: "44rem", marginInline: "auto" }}>{libraryBand}</h2>
        <div style={{ marginTop: "2.25rem" }}><StartLink>{ctaLong}</StartLink></div>
      </div>
    </section>
  );
}

