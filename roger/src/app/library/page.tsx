import type { Metadata } from "next";
import { LibraryBand } from "@/components/v3/blocks";

export const metadata: Metadata = { title: "Use cases" };

export default function LibraryPage() {
  return (
    <>
      <section className="ground page-top" data-tone="ground" style={{ paddingBottom: "clamp(5rem, 12vh, 8rem)" }}>
        <div className="wrap">
          <h1 className="t-display">Use cases</h1>
          <p className="draft-note narrow" style={{ marginTop: "2rem" }}>
            Preview note: the public library already exists on meetroger.ai and stays as it is. Its cards and its live count are read from the
            database, which this preview does not have. The only v3 change is the band below, and cards no longer link to the old setup page.
          </p>
        </div>
      </section>
      <LibraryBand />
    </>
  );
}
