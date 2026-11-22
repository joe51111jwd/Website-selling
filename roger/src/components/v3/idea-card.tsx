"use client";

import { useRef, useState, type CSSProperties } from "react";
import { siteConfig } from "@/data/config";
import { factorLabels, type Factor, type Idea } from "@/data/sample-ideas";

const factorOrder: Factor[] = ["hours", "reach", "ease", "proof", "surprise"];

export function Score({ value }: { value: number }) {
  return (
    <span className="score num" style={{ "--s": value } as CSSProperties} aria-label={`Your score: ${value} out of 100`}>
      <svg viewBox="0 0 36 36" aria-hidden="true">
        <circle className="tr" cx="18" cy="18" r="15.9155" />
        <circle className="va" cx="18" cy="18" r="15.9155" pathLength="100" />
      </svg>
      {value}
    </span>
  );
}

export function FactorBars({ factors }: { factors: Idea["factors"] }) {
  return (
    <div className="bars" style={{ marginTop: 0 }}>
      {factorOrder.map((k) => (
        <div className="bar" key={k}>
          <span>{factorLabels[k]}</span>
          <span className="bar-track"><span className="bar-fill" style={{ "--c": `var(--color-f-${k})`, "--v": factors[k] } as CSSProperties} /></span>
          <span className="num ink-2" style={{ textAlign: "right" }}>{factors[k]}</span>
        </div>
      ))}
    </div>
  );
}

export function Playbook({ idea, notes }: { idea: Idea; notes?: boolean }) {
  return (
    <div className="pb">
      {idea.playbook.map((p) => (
        <div className="pb-part" key={p.label}>
          <div>
            <p style={{ fontWeight: 620 }}>{p.label}</p>
            {notes && <p className="t-meta ink-2" style={{ marginTop: "0.25rem" }}>{p.note}</p>}
          </div>
          <div className="t-small">
            {p.text && <p>{p.text}</p>}
            {p.items && (p.ordered ? <ol>{p.items.map((t) => <li key={t}>{t}</li>)}</ol> : <ul>{p.items.map((t) => <li key={t}>{t}</li>)}</ul>)}
          </div>
        </div>
      ))}
    </div>
  );
}

const asText = (idea: Idea) =>
  [
    siteConfig.v3.playbookPreface,
    "",
    idea.title,
    "",
    ...idea.playbook.map((p, i) => `${i + 1}. ${p.label}\n${p.text ?? ""}${(p.items ?? []).map((t, j) => `${p.ordered ? `${j + 1}.` : "-"} ${t}`).join("\n")}`),
    "",
    `9. Paste to install\n${idea.paste}`,
  ].join("\n");

export function PasteBlock({ idea }: { idea: Idea }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(asText(idea));
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {}
  };
  return (
    <div className="paste night">
      <p className="t-eyebrow ink-2">Paste to install</p>
      <pre><span className="preface">{siteConfig.v3.playbookPreface}</span>{"\n\n"}{idea.paste}</pre>
      <button type="button" className="btn btn-sm btn-light" onClick={copy}>
        {copied ? "Copied" : "Copy prompt and playbook"}
      </button>
      <span role="status" className="sr-only">{copied ? "Prompt and playbook copied" : ""}</span>
    </div>
  );
}

/** The front of an idea, and the sheet that pulls out of it. A native dialog traps focus,
    closes on Escape and returns focus to the card that opened it. */
export function IdeaCard({ idea, index }: { idea: Idea; index: number }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const id = `idea-${idea.id}`;
  return (
    <>
      <button type="button" className="idea" aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}>
        <span className="idea-top">
          <span className="t-meta ink-2">Idea {index + 1} · {idea.category}</span>
          <Score value={idea.score} />
        </span>
        <h3>{idea.title}</h3>
        <span className="t-small ink-2">{idea.fit}</span>
        <span className="idea-time t-meta">
          <span>{idea.timeLine}</span>
        </span>
        <span className="open">Open the playbook <span aria-hidden="true">›</span></span>
      </button>

      <dialog ref={dialog} className="sheet" aria-labelledby={id} onClick={(e) => e.target === dialog.current && dialog.current?.close()}>
        <div className="sheet-head">
          <span className="t-meta ink-2">Idea {index + 1} · {idea.category}</span>
          <button type="button" className="close-btn" aria-label="Close" onClick={() => dialog.current?.close()}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M2 2l10 10M12 2L2 12" /></svg>
          </button>
        </div>
        <div className="sheet-body">
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1.5rem", alignItems: "flex-start" }}>
            <h2 id={id} className="t-h3">{idea.title}</h2>
            <Score value={idea.score} />
          </div>
          <p className="t-lead">{idea.desc}</p>
          <div>
            <div className="tiles">
              {idea.tiles.map((t) => (
                <div className="tile" key={t.label}>
                  <span className="t-meta ink-2">{t.label}</span>
                  <span className="v num">{t.value}</span>
                  <span className="t-meta">{t.unit}</span>
                  <span className="t-meta ink-2" style={{ marginTop: "0.4rem" }}>{t.note}</span>
                </div>
              ))}
            </div>
            <p className="t-meta ink-2" style={{ marginTop: "0.75rem" }}>Time figures are estimates from other users&rsquo; runs. They are not a promise of what you will save.</p>
          </div>
          <PasteBlock idea={idea} />
          <div>
            <h3 className="t-title" style={{ marginBottom: "1rem" }}>How Cora scored it</h3>
            <FactorBars factors={idea.factors} />
          </div>
          <div>
            <h3 className="t-title" style={{ marginBottom: "0.75rem" }}>The playbook</h3>
            <Playbook idea={idea} />
          </div>
          <details className="math">
            <summary>How the time saved was worked out</summary>
            <div className="t-small ink-2" style={{ paddingBottom: "1rem", display: "grid", gap: "1rem" }}>
              {idea.math.map((m) => (
                <div key={m.head}>
                  <p style={{ fontWeight: 620, color: "var(--color-ink)" }}>{m.head}</p>
                  <ul>{m.lines.map((l) => <li key={l}>{l}</li>)}</ul>
                </div>
              ))}
            </div>
          </details>
        </div>
      </dialog>
    </>
  );
}
