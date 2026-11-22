import type { Metadata } from "next";
import { ClosingBand } from "@/components/v3/blocks";
import { Letter } from "@/components/v3/letter";
import { home } from "@/data/v3-copy";

export const metadata: Metadata = { title: "About", description: "Roger is run by Peter Kuperman, in Toronto." };

export default function AboutPage() {
  return (
    <>
      <section className="ground page-top" data-tone="ground" style={{ paddingBottom: "clamp(5rem, 12vh, 9rem)" }}>
        <div className="wrap">
          <div className="narrow" style={{ marginInline: "auto" }}>
            <h1 className="t-display" style={{ marginBottom: "3.5rem" }}>{home.letterLead}</h1>
          </div>
          <Letter />
        </div>
      </section>
      <ClosingBand line={home.closing} />
    </>
  );
}
