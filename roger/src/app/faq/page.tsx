import type { Metadata } from "next";
import { ClosingBand } from "@/components/v3/blocks";
import { Questions } from "@/components/v3/questions";
import { faqGroups, faqs, home } from "@/data/v3-copy";

export const metadata: Metadata = { title: "Questions", description: "Getting started, Zack and privacy, Cora and the ideas, price and billing." };

export default function FaqPage() {
  return (
    <>
      <section className="ground page-top" data-tone="ground" style={{ paddingBottom: "clamp(5rem, 12vh, 9rem)" }}>
        <div className="wrap">
          <div style={{ maxWidth: "46rem", marginInline: "auto" }}>
            <h1 className="t-display">Questions</h1>
            {faqGroups.map((g) => (
              <section key={g} style={{ marginTop: "4rem" }}>
                <h2 className="t-eyebrow ink-2" style={{ marginBottom: "1rem" }}>{g}</h2>
                <Questions items={faqs.filter((f) => f.group === g)} />
              </section>
            ))}
          </div>
        </div>
      </section>
      <ClosingBand line={home.closing} />
    </>
  );
}
