// The offer's receipt, PHONE MODE (BRIEF beat 8, ROUND 3). The same slip as on laptops, cut to the
// rows that matter on a phone: what you get (a tick each), the founding-rate placeholder ⚑, what
// it costs you (one call), the $0 total, Andrew's signature. It prints once, quickly, when it
// arrives: the paper is already in its place (nothing around it moves, no empty band waits on
// the print), the printer's lip runs down it and each row comes up as the lip passes, then the
// slip settles and Andrew signs it. All transform/opacity, timed by CSS from one arrival.

import { useEffect, useId, useRef } from "react";
import { Logo } from "../../brand/Logo";
import { FLAG, RECEIPT } from "../../content/copy";
import { useArrive, useSteps } from "../phone/useArrive";
import { Edge } from "./Receipt";
import { Signature } from "./Signature";

/** One row's print time (ms). */
const ROW_MS = 46;

function Tick() {
  return (
    <svg className="rcp-tick" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3.2 8.4 6.4 11.4 12.8 4.6" />
    </svg>
  );
}

export function ReceiptPhone({ onSigned }: { onSigned?: () => void }) {
  const titleId = useId();
  // prints once the slip is a third on screen (its top rows are then well inside the viewport)
  const [ref, on] = useArrive<HTMLDivElement>({ amount: 0.3 });

  // the rows, in print order; each gets its index for the CSS delay
  let r = 0;
  const row = () => ({ "data-r": r, style: { ["--r" as string]: r++ } });

  const rows = (
    <>
      <div className="rcp-row rcp-head" {...row()}>
        <Logo className="rcp-logo" title="SmartCrew" />
      </div>
      <div className="rcp-row rcp-title" {...row()}>
        <span id={titleId}>{RECEIPT.title}</span>
      </div>
      <div className="rcp-row rcp-rule" {...row()} />
      <div className="rcp-row rcp-h t-label" {...row()}>
        {RECEIPT.get}
      </div>
      {RECEIPT.items.map((it) => (
        <div key={it.item} className="rcp-row rcp-line" {...row()}>
          <span>{it.item}</span>
          <Tick />
          <span className="sr-only">{RECEIPT.included}</span>
        </div>
      ))}
      {RECEIPT.showProposals && (
        <div className="rcp-row rcp-line rcp-flag" {...row()}>
          <span>{RECEIPT.proposalItem}</span>
          <span className="rcp-flag-mark" title="Proposal: needs Andrew’s OK">
            {FLAG}
          </span>
        </div>
      )}
      <div className="rcp-row rcp-rule" {...row()} />
      <div className="rcp-row rcp-h t-label" {...row()}>
        {RECEIPT.costs}
      </div>
      <div className="rcp-row rcp-line" {...row()}>
        <span>{RECEIPT.call}</span>
        <span className="rcp-val">{RECEIPT.callValue}</span>
      </div>
      <div className="rcp-row rcp-rule rcp-rule--double" {...row()} />
      <div className="rcp-row rcp-line rcp-total" {...row()}>
        <span>{RECEIPT.total}</span>
        <span className="rcp-val">{RECEIPT.totalValue}</span>
      </div>
      <div className="rcp-row rcp-sign" {...row()}>
        <span className="rcp-x" aria-hidden="true">
          ×
        </span>
        <span className="rcp-sig">
          <span className="rcp-sig-wipe">
            <Signature className="rcp-sig-svg" title={RECEIPT.signatureAlt} />
          </span>
        </span>
      </div>
      <div className="rcp-row rcp-by" {...row()}>
        {RECEIPT.signedBy}
      </div>
    </>
  );
  const printMs = r * ROW_MS;

  // after the print: torn off (the slip settles), signed, then the button below gets its cue
  const step = useSteps(on, [printMs + 120, printMs + 420, printMs + 1350]);
  const state = !on ? "idle" : step === 0 ? "printing" : step === 1 ? "torn" : "signed";
  const fired = useRef(false);
  useEffect(() => {
    if (step < 3 || fired.current) return;
    fired.current = true;
    onSigned?.();
  }, [step, onSigned]);

  return (
    <div ref={ref} className="rcp" data-state={state} role="figure" aria-labelledby={titleId} style={{ ["--print" as string]: `${printMs}ms`, ["--row" as string]: `${ROW_MS}ms` }}>
      <span className="rcp-shadow" aria-hidden="true" />
      <div className="rcp-paper">
        <Edge side="top" teeth={28} />
        <div className="rcp-body">{rows}</div>
        <Edge side="bottom" teeth={28} />
        {/* the printer's lip, riding down the paper while it prints */}
        <span className="rcp-track" aria-hidden="true">
          <span className="rcp-lip" />
        </span>
      </div>
    </div>
  );
}
