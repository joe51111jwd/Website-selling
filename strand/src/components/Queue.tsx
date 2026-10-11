import { useEffect, useRef, useState } from "react";
import { filaments, fmtTime, priceFor, productBySlug, sizes, stats } from "../content/catalog";
import { removeFromQueue, store, useStore } from "../lib/store";

// The cart, called a queue: every item is printed after it's ordered.
export default function Queue() {
  const open = useStore((s) => s.queueOpen);
  const queue = useStore((s) => s.queue);
  const [note, setNote] = useState(false);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) panel.current?.focus();
    else setNote(false);
  }, [open]);

  const rows = queue.flatMap((q) => {
    const p = productBySlug(q.slug);
    const f = filaments[q.filament];
    const size = sizes.find((s) => s.id === q.size) ?? sizes[1];
    if (!p || !f) return [];
    return [{ q, p, f, size, price: priceFor(p, size), min: stats(p, size.mm, f).minutes }];
  });
  const total = rows.reduce((s, r) => s + r.price, 0);
  const minutes = rows.reduce((s, r) => s + r.min, 0);

  return (
    <div className={`queue${open ? " is-open" : ""}`} aria-hidden={!open}>
      <div className="queue__scrim" onClick={() => store.set({ queueOpen: false })} />
      <div ref={panel} className="queue__panel" role="dialog" aria-modal="true" aria-label="Your print queue" tabIndex={-1} data-lenis-prevent>
        <div className="queue__head">
          <h2>Your queue</h2>
          <button className="icon-btn" onClick={() => store.set({ queueOpen: false })} aria-label="Close the queue">
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3l10 10M13 3 3 13" /></svg>
          </button>
        </div>
        {rows.length === 0 ? (
          <p className="queue__empty">Nothing queued yet. Pick a piece on the line and it'll be printed when you order.</p>
        ) : (
          <ul className="queue__list">
            {rows.map(({ q, p, f, size, price, min }) => (
              <li key={q.id} className="queue__item">
                <svg className="queue__cube" viewBox="0 0 40 44" style={{ ["--c" as string]: f.hex }} aria-hidden="true">
                  <path className="t" d="M20 4 36 13 20 22 4 13Z" />
                  <path className="l" d="M4 13 20 22V40L4 31Z" />
                  <path className="r" d="M36 13 20 22V40L36 31Z" />
                  <path className="ln" d="M4 19l16 9 16-9M4 25l16 9 16-9" />
                </svg>
                <span className="queue__what">
                  <b>No. {p.no} {p.name}</b>
                  <span className="mono">{f.name} {f.material} · {size.id} {size.mm} mm · {fmtTime(min)}</span>
                </span>
                <span className="queue__price">${price}</span>
                <button className="queue__remove mono" onClick={() => removeFromQueue(q.id)} aria-label={`Remove ${p.name}`}>Remove</button>
              </li>
            ))}
          </ul>
        )}
        <div className="queue__foot">
          <p className="mono queue__time">{rows.length ? `Prints in about ${fmtTime(minutes)}, ships in 2–3 days` : " "}</p>
          <p className="queue__total"><span>Total</span><b>${total}</b></p>
          <button className="btn btn--big" disabled={!rows.length} onClick={() => setNote(true)}>Order and start printing</button>
          {note && <p className="queue__note mono" role="status">Mockup: checkout (Stripe or Shopify) connects here at launch.</p>}
        </div>
      </div>
    </div>
  );
}
