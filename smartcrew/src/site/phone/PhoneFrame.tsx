// A crisp 2D iPhone for PHONE MODE (no WebGL on phones; scratchpad design/v2/phone/PHONE.md).
// Real proportions (iPhone 17 Pro: a 402 × 874 pt screen in a 430 × 900 body, 56 pt screen
// corners, the Dynamic Island 126 × 37 pt, 11 pt from the top), black titanium rim, side buttons,
// all CSS (vector-sharp at any size). The screen slot shows a stack of states (images of the real
// app screens, phone-sized via srcset, or live React screens scaled from 402 px) and crossfades
// between them with opacity only. A finger tap lands on any native-px box: the finger presses,
// the button darkens (depresses) and an orange ripple rings out, all transform/opacity.
//
//   <PhoneFrame
//     screens={["phone-home", "renders/day-s/phone-d-clockedin.webp"]}  // ids or files under public/
//     index={after ? 1 : 0}                                            // the state on show
//     tap={{ box: [118.5, 383.3, 165, 165], n: taps }}                 // n changes → it plays again
//     sizes="210px" alt="…" />
//
// Size it with CSS (width on .pf or its parent; the height follows the 430:900 body), or `width`.

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { screenUrl } from "../../three/stage/urls";
import "./phone-frame.css";

/** Native size of the phone screens (CSS px / pt). */
export const SCREEN = { w: 402, h: 874 } as const;
/** The body around it (same units). */
export const BODY = { w: 430, h: 900 } as const;

export type Box = [x: number, y: number, w: number, h: number];
export type Screen = string | ReactNode;
export type Tap = {
  /** The button's box on the screen, native px (402 × 874). */
  box: Box;
  /** Change it to play the tap again (0 = no tap yet). */
  n: number;
  /** "touch" (default): a finger; "notify": no finger, just the ring (something arrived). */
  kind?: "touch" | "notify";
};

export type PhoneFrameProps = {
  /** The states, bottom to top: screen ids ("phone-home"), files under public/, or live React screens (402 × 874). */
  screens: Screen[];
  /** Which state shows (later states fade in over earlier ones). */
  index?: number;
  tap?: Tap | null;
  /** CSS width (else size .pf with CSS). */
  width?: string;
  /** The `sizes` for the screen images' srcset (the screen is ~93% of the frame's width). */
  sizes?: string;
  loading?: "eager" | "lazy";
  alt?: string;
  /** A rim that reads on dark grounds. */
  tone?: "light" | "dark";
  /** Soft contact shadow under the phone (a static gradient, no blur filter). */
  shadow?: boolean;
  className?: string;
  style?: CSSProperties;
  /** Drawn over the screen (absolute, screen-sized; place children in % of 402 × 874). */
  children?: ReactNode;
};

const base = import.meta.env.BASE_URL;
/** The phone-sized copy of a phone screen (public/phone/screens/<name>-720.webp), for srcset. */
export function phoneSmall(id: string) {
  const name = (id.split("/").pop() ?? id).replace(/\.webp$/, "");
  return `${base}phone/screens/${name}-720.webp`;
}
/** srcset for a phone screen: the 720 px copy, the 1206 px (3x) original. */
export function phoneSrcSet(id: string) {
  return `${phoneSmall(id)} 720w, ${screenUrl(id)} 1206w`;
}

/** % of the screen for a native px box (for placing overlays). */
export const pct = (b: Box): CSSProperties => ({
  left: `${(b[0] / SCREEN.w) * 100}%`,
  top: `${(b[1] / SCREEN.h) * 100}%`,
  width: `${(b[2] / SCREEN.w) * 100}%`,
  height: `${(b[3] / SCREEN.h) * 100}%`,
});

function Live({ children }: { children: ReactNode }) {
  // a live screen is drawn at 402 px and scaled to the slot (measured once per resize, not per frame)
  const ref = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(0);
  useEffect(() => {
    const el = ref.current?.parentElement;
    if (!el) return;
    const ro = new ResizeObserver(() => setK(el.clientWidth / SCREEN.w));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} className="pf-live" style={{ transform: `scale(${k})`, visibility: k ? undefined : "hidden" }}>
      {children}
    </div>
  );
}

export function PhoneFrame({
  screens,
  index = 0,
  tap,
  width,
  sizes = "220px",
  loading = "lazy",
  alt = "",
  tone = "light",
  shadow = true,
  className,
  style,
  children,
}: PhoneFrameProps) {
  const tapStyle = tap ? pct(tap.box) : undefined;
  const round = tap ? Math.abs(tap.box[2] - tap.box[3]) < 6 : false;
  return (
    <div
      className={`pf pf--${tone}${shadow ? " pf--shadow" : ""}${className ? ` ${className}` : ""}`}
      style={width ? { ...style, width } : style}
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
    >
      <div className="pf-body">
        <span className="pf-btn pf-btn--action" />
        <span className="pf-btn pf-btn--volup" />
        <span className="pf-btn pf-btn--voldn" />
        <span className="pf-btn pf-btn--power" />
        <span className="pf-btn pf-btn--camera" />
        <div className="pf-bezel">
          <div className="pf-screen">
            {screens.map((s, i) => (
              <div key={i} className={`pf-layer${i <= index ? " is-on" : ""}`} aria-hidden="true">
                {typeof s === "string" ? (
                  <img src={phoneSmall(s)} srcSet={phoneSrcSet(s)} sizes={sizes} alt="" loading={loading} decoding="async" draggable={false} />
                ) : (
                  <Live>{s}</Live>
                )}
              </div>
            ))}
            {tap && tap.n > 0 && (
              <div key={tap.n} className={`pf-tap${round ? " is-round" : ""}${tap.kind === "notify" ? " is-notify" : ""}`} style={tapStyle} aria-hidden="true">
                <span className="pf-press" />
                <span className="pf-ring" />
                {tap.kind !== "notify" && <span className="pf-finger" />}
              </div>
            )}
            {children}
            <span className="pf-island" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  );
}
