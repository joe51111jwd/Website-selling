"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function Params() {
  const q = [...useSearchParams().entries()];
  if (!q.length) return null;
  return (
    <dl className="card" style={{ marginTop: "2rem", display: "grid", gridTemplateColumns: "auto 1fr", gap: "0.5rem 1.5rem", fontFamily: "var(--font-mono)", fontSize: "0.9375rem" }}>
      {q.map(([k, v]) => (
        <div key={k} style={{ display: "contents" }}><dt className="ink-2">{k}</dt><dd>{v}</dd></div>
      ))}
    </dl>
  );
}

/** PREVIEW ONLY. These routes belong to the app (Part B). Delete this file and the three
    stub routes when porting; they exist so the preview's buttons land somewhere. */
export function HandoffStub({ route, what }: { route: string; what: string }) {
  return (
    <section className="ground page-top" data-tone="ground" style={{ minHeight: "80svh", paddingBottom: "6rem" }}>
      <div className="wrap">
        <div className="narrow">
          <p className="t-eyebrow ink-2">Preview handoff · {route}</p>
          <h1 className="t-h2" style={{ marginTop: "0.75rem" }}>{what}</h1>
          <p className="t-lead ink-2" style={{ marginTop: "1rem" }}>This page belongs to the Roger app, which Peter is building. The marketing site hands over here.</p>
          <Suspense><Params /></Suspense>
          <p style={{ marginTop: "2rem" }}><Link className="link" href="/"><span aria-hidden="true">‹</span> Back to the site</Link></p>
        </div>
      </div>
    </section>
  );
}
