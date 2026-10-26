import { useEffect, useState, type CSSProperties, type HTMLAttributes, type Ref } from "react";
import { cb, fmtWords } from "../closedloop";

const BASE = import.meta.env.BASE_URL;
const file = (name: string) => `${BASE}cb/${name}`;
const pct = ([l, t, w, h]: number[]) => ({ left: `${l * 100}%`, top: `${t * 100}%`, width: `${w * 100}%`, height: `${h * 100}%` });

// the stamp: Playfair Display Black, as on the system blocks, cut to the letters the block says
let stamp: Promise<unknown> | null = null;
function loadStamp() {
  if (!stamp) {
    if (typeof FontFace === "undefined") return Promise.resolve();
    const ff = new FontFace("SUSD Stamp", `url(${file(cb.files.font)}) format("woff2")`, { weight: "900", display: "block" });
    document.fonts.add(ff);
    stamp = ff.load().catch(() => undefined);
  }
  return stamp;
}

// the block's proportions and where its shadow slides as it lifts (4px, the way the light throws it)
const [dx, dy] = [cb.drift[0], cb.drift[1] * cb.bodyAR];
const dn = Math.hypot(dx, dy) || 1;
const VARS = { "--cb-ar": cb.bodyAR, "--sx": `${((4 * dx) / dn).toFixed(2)}px`, "--sy": `${((4 * dy) / dn).toFixed(2)}px`, "--slot": `${cb.slot}em`, "--comma": `${cb.comma}em` } as CSSProperties;

export type BlockLabels = { copy: string; copied: string; again: string; words: string; copying: string; tryAgain: string; name: string; nameAgain: string };

type Props = Omit<HTMLAttributes<HTMLButtonElement>, "children"> & {
  ref?: Ref<HTMLButtonElement>;
  digitsRef: Ref<HTMLSpanElement>;
  words: number;
  closed: boolean;
  labels: BlockLabels;
  /** load the pictures (the section is near); `hi` picks the larger set */
  load: false | "hi" | "lo";
};

/**
 * The COPY button: a painted block from the same studio as the ring, its words stamped by the page.
 * The face (data-face) is written by the closed loop's ritual, never by React, so the count can run
 * without re-rendering anything.
 */
export function CopyBlock({ ref, digitsRef, words, closed, labels, load, ...rest }: Props) {
  const [set, setSet] = useState<"" | "hi" | "lo">("");
  const [ready, setReady] = useState<"" | "1" | "flat">("");
  useEffect(() => {
    if (load && !set) setSet(load);
  }, [load, set]);
  useEffect(() => {
    if (!set) return;
    let gone = false;
    const pics = [cb.files[set === "hi" ? "red" : "red_m"], cb.files.rest, cb.files.lift].map((name) => {
      const im = new Image();
      im.decoding = "async";
      im.src = file(name);
      return im.decode();
    });
    Promise.all([...pics, loadStamp()]).then(
      () => {
        if (gone) return;
        setReady("1");
        // the green paint is only needed once the loop closes: decode it when the page is idle
        const green = new Image();
        green.src = file(cb.files[set === "hi" ? "green" : "green_m"]);
        const idle = window.requestIdleCallback ?? ((f: () => void) => window.setTimeout(f, 200));
        idle(() => void green.decode().catch(() => undefined));
      },
      () => !gone && setReady("flat"),
    );
    return () => {
      gone = true;
    };
  }, [set]);

  const count = words ? fmtWords(words) : "";
  const name = `${closed ? labels.nameAgain : labels.name}${count ? `, ${count} ${labels.words}` : ""}`;
  const src = (k: "red" | "green") => (set ? file(cb.files[set === "hi" ? k : (`${k}_m` as const)]) : undefined);
  return (
    <button ref={ref} type="button" className="cb" aria-label={name} data-ready={ready || undefined} style={VARS} onContextMenu={(e) => e.preventDefault()} {...rest}>
      <span className="cb-shd lift" style={pct(cb.shd)} aria-hidden="true">
        {set && <img src={file(cb.files.lift)} alt="" draggable={false} decoding="async" />}
      </span>
      <span className="cb-shd rest" style={pct(cb.shd)} aria-hidden="true">
        {set && <img src={file(cb.files.rest)} alt="" draggable={false} decoding="async" />}
      </span>
      <span className="cb-pose" aria-hidden="true">
        <span className="cb-body">
          {set && <img className="cb-paint red" src={src("red")} alt="" draggable={false} decoding="async" style={pct(cb.block)} />}
          {set && <img className="cb-paint green" src={src("green")} alt="" draggable={false} decoding="async" style={pct(cb.block)} />}
          <span className="cb-face" style={pct(cb.face)}>
            <span className="cb-big">
              <b data-k="copy">{labels.copy}</b>
              <b data-k="num">
                <span className="cb-num" ref={digitsRef} />
              </b>
              <b data-k="wait">· · ·</b>
              <b data-k="done">{labels.copied}</b>
            </span>
            <span className="cb-small">
              <b data-k="words">{count && `${count} ${labels.words}`}</b>
              <b data-k="count">{labels.words}</b>
              <b data-k="wait">{labels.copying}</b>
              <b data-k="again">{labels.again}</b>
              <b data-k="error">{labels.tryAgain}</b>
            </span>
          </span>
        </span>
      </span>
    </button>
  );
}
