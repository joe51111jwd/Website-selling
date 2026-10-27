import { useEffect, useState, type ButtonHTMLAttributes, type CSSProperties, type Ref } from "react";
import { cb, fmtWords } from "../closedloop";

const BASE = import.meta.env.BASE_URL;
const file = (name: string) => `${BASE}cb/${name}`;
const pct = ([l, t, w, h]: number[]) => ({ left: `${l * 100}%`, top: `${t * 100}%`, width: `${w * 100}%`, height: `${h * 100}%` });

// the stamp: Playfair Display Black, as on the system blocks, cut to the letters the block says
let stamp: Promise<unknown> | null = null;
function loadStamp() {
  if (!stamp) {
    if (typeof FontFace === "undefined") return Promise.resolve();
    // added only once it has loaded, so the face never goes blank: the fallback serif shows until then
    const ff = new FontFace("SUSD Stamp", `url(${file(cb.files.font)}) format("woff2")`, { weight: "900" });
    stamp = ff.load().then(
      () => void document.fonts.add(ff),
      () => undefined,
    );
  }
  return stamp;
}

// the block's proportions and where its shadow slides as it lifts (4px, the way the light throws it)
const [dx, dy] = [cb.drift[0], cb.drift[1] * cb.bodyAR];
const dn = Math.hypot(dx, dy) || 1;
const VARS = { "--cb-ar": cb.bodyAR, "--sx": `${((4 * dx) / dn).toFixed(2)}px`, "--sy": `${((4 * dy) / dn).toFixed(2)}px`, "--slot": `${cb.slot}em`, "--comma": `${cb.comma}em` } as CSSProperties;

export type BlockLabels = { get: string; bootloader: string; sent: string; inbox: string; yours: string; words: string; sending: string; tryAgain: string };

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  ref?: Ref<HTMLButtonElement>;
  digitsRef: Ref<HTMLSpanElement>;
  words: number;
  labels: BlockLabels;
  /** load the pictures (the section is near); `hi` picks the larger set */
  load: false | "hi" | "lo";
};

/**
 * The opt-in's button: a painted block from the same studio as the ring, its words stamped by the page.
 * The face (data-face), the count and the accessible name are written by the closed loop's ritual,
 * never by React, so the count can run without re-rendering anything.
 */
export function CopyBlock({ ref, digitsRef, words, labels, load, ...rest }: Props) {
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
  const src = (k: "red" | "green") => (set ? file(cb.files[set === "hi" ? k : (`${k}_m` as const)]) : undefined);
  return (
    <button ref={ref} type="button" className="cb" data-ready={ready || undefined} style={VARS} onContextMenu={(e) => e.preventDefault()} {...rest}>
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
              <b data-k="get">{labels.get}</b>
              <b data-k="num">
                <span className="cb-num" ref={digitsRef} />
              </b>
              <b data-k="wait">· · ·</b>
              <b data-k="sent">{labels.sent}</b>
              <b data-k="yours">{labels.yours}</b>
            </span>
            <span className="cb-small">
              <b data-k="bootloader">{labels.bootloader}</b>
              <b data-k="words">{count && `${count} ${labels.words}`}</b>
              <b data-k="count">{labels.words}</b>
              <b data-k="wait">{labels.sending}</b>
              <b data-k="inbox">{labels.inbox}</b>
              <b data-k="error">{labels.tryAgain}</b>
            </span>
          </span>
        </span>
      </span>
    </button>
  );
}
