import type { Metadata } from "next";
import { PriceBlock } from "@/components/v3/price-block";
import { Reveal } from "@/components/v3/reveal";
import { StartLink } from "@/components/v3/start-link";
import { siteConfig } from "@/data/config";
import { cardLine, ctaLong, pricing } from "@/data/v3-copy";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Two free Monday lists. Then US$200 a month, or US$100 for one list at a time. In Canada, CA$280 a month or CA$140 a list.",
};

export default function PricingPage() {
  const included = siteConfig.flags.groupSession ? [...pricing.included, pricing.includedSession] : pricing.included;
  return (
    <>
      <section className="night page-top" data-tone="night" style={{ paddingBottom: "clamp(4rem, 10vh, 7rem)" }}>
        <PriceBlock heading={pricing.title} as="h1" />
      </section>

      <section className="chapter ground" data-tone="ground">
        <div className="wrap" style={{ display: "grid", gap: "clamp(4rem, 10vh, 6.5rem)" }}>
          <Reveal className="narrow" style={{ marginInline: "auto", width: "100%" }}>
            <h2 className="t-h3">What is included</h2>
            <ul style={{ marginTop: "1.5rem" }}>
              {included.map((line) => (
                <li key={line} className="t-lead" style={{ padding: "1rem 0", borderTop: "1px solid var(--color-rule)" }}>{line}</li>
              ))}
            </ul>
          </Reveal>

          <Reveal style={{ maxWidth: "58rem", marginInline: "auto", width: "100%" }}>
            <h2 className="t-h3">Monthly or one at a time</h2>
            <div className="two-col" style={{ marginTop: "1.5rem" }}>
              <div className="card">
                <h3 className="t-title">Monthly</h3>
                <p className="ink-2" style={{ marginTop: "0.5rem" }}>{pricing.monthly}</p>
              </div>
              <div className="card">
                <h3 className="t-title">One at a time</h3>
                <p className="ink-2" style={{ marginTop: "0.5rem" }}>{pricing.single}</p>
              </div>
            </div>
            <p style={{ marginTop: "1.25rem", fontWeight: 600 }}>{pricing.same}</p>
          </Reveal>

          <Reveal className="narrow" style={{ marginInline: "auto" }}>
            <h2 className="t-h3">How contributing works</h2>
            <p className="t-lead ink-2" style={{ marginTop: "1.25rem" }}>{pricing.contributing}</p>
          </Reveal>

          <Reveal className="narrow" style={{ marginInline: "auto" }}>
            <h2 className="t-h3">No refunds</h2>
            <p className="t-lead ink-2" style={{ marginTop: "1.25rem" }}>{pricing.refunds}</p>
            <div style={{ marginTop: "2.5rem" }}><StartLink>{ctaLong}</StartLink></div>
            <p className="t-meta ink-2" style={{ marginTop: "0.9rem" }}>{cardLine}</p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
