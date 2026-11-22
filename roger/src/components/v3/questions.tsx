"use client";

import { useId, useState } from "react";
import type { Faq } from "@/data/v3-copy";

export function Questions({ items }: { items: Faq[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const base = useId();
  return (
    <div className="qa">
      {items.map((f, i) => {
        const isOpen = open === i;
        return (
          <div className="qa-item" key={f.q}>
            <h3>
              <button type="button" className="qa-q" aria-expanded={isOpen} aria-controls={`${base}-a${i}`} id={`${base}-q${i}`} onClick={() => setOpen(isOpen ? null : i)}>
                {f.q}
                <span className="pm" aria-hidden="true" />
              </button>
            </h3>
            <div className="qa-a" id={`${base}-a${i}`} role="region" aria-labelledby={`${base}-q${i}`} data-open={isOpen ? "" : undefined}>
              <div><p>{f.a}</p></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
