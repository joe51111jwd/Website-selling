import { legalDated, type LegalSection } from "@/data/legal";

export function LegalPage({ title, sections }: { title: string; sections: LegalSection[] }) {
  return (
    <section className="ground page-top" data-tone="ground" style={{ paddingBottom: "clamp(5rem, 12vh, 9rem)" }}>
      <div className="wrap">
        <div className="narrow prose" style={{ marginInline: "auto" }}>
          <h1 className="t-display">{title}</h1>
          <p className="t-meta ink-2" style={{ marginTop: "1.25rem" }}>{legalDated}</p>
          <p className="draft-note" style={{ marginTop: "1.5rem" }}>Draft. This text has not yet been reviewed.</p>
          {sections.map((s) => (
            <section key={s.title}>
              <h2>{s.title}</h2>
              {s.body.map((p) => <p key={p}>{p}</p>)}
              {s.list && <ul>{s.list.map((l) => <li key={l}>{l}</li>)}</ul>}
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}
