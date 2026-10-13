// A minimal 2D MacBook for PHONE MODE (no WebGL on phones; scratchpad design/v2/phone/PHONE.md):
// black lid with a notch, a 1440 × 900 screen slot, a thin base. All CSS (vector-sharp). Use it
// for context only: at phone sizes a full office screen can't be read, so the change itself goes
// in a crisp live card (see One Day's office card). Same screen stack/crossfade as PhoneFrame,
// plus an optional orange ring on the exact row (native px of the 1440 × 900 screen).
//
//   <LaptopFrame screens={["web-dashboard"]} ring={[339, 694, 1057, 66]} sizes="340px" />

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { screenUrl } from "../../three/stage/urls";
import type { Box } from "./PhoneFrame";
import "./laptop-frame.css";

export const WEB = { w: 1440, h: 900 } as const;

const base = import.meta.env.BASE_URL;
/** srcset for a web screen: the 960 px phone copy (public/phone/screens), the 2880 px (2x) original. */
export function webSrcSet(id: string) {
  const name = (id.split("/").pop() ?? id).replace(/\.webp$/, "");
  return `${base}phone/screens/${name}-960.webp 960w, ${screenUrl(id)} 2880w`;
}

function Live({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(0);
  useEffect(() => {
    const el = ref.current?.parentElement;
    if (!el) return;
    const ro = new ResizeObserver(() => setK(el.clientWidth / WEB.w));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} className="lf-live" style={{ transform: `scale(${k})`, visibility: k ? undefined : "hidden" }}>
      {children}
    </div>
  );
}

export type LaptopFrameProps = {
  /** Web screen ids ("web-dashboard"), files under public/ ("renders/day-s/web-d-hauling.webp"), or live screens (1440 × 900). */
  screens: (string | ReactNode)[];
  index?: number;
  /** An orange ring on the exact row (native px, 1440 × 900); it pings once when it appears. */
  ring?: Box | null;
  sizes?: string;
  loading?: "eager" | "lazy";
  alt?: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
};

export function LaptopFrame({ screens, index = 0, ring, sizes = "360px", loading = "lazy", alt = "", className, style, children }: LaptopFrameProps) {
  return (
    <div className={`lf${className ? ` ${className}` : ""}`} style={style} role={alt ? "img" : undefined} aria-label={alt || undefined} aria-hidden={alt ? undefined : true}>
      <div className="lf-in">
        <div className="lf-lid">
          <div className="lf-screen">
            {screens.map((s, i) => (
              <div key={i} className={`lf-layer${i <= index ? " is-on" : ""}`}>
                {typeof s === "string" ? <img src={screenUrl(s)} srcSet={webSrcSet(s)} sizes={sizes} alt="" loading={loading} decoding="async" draggable={false} /> : <Live>{s}</Live>}
              </div>
            ))}
            {ring && (
              <span
                key={ring.join(",")}
                className="lf-ring"
                style={{ left: `${(ring[0] / WEB.w) * 100}%`, top: `${(ring[1] / WEB.h) * 100}%`, width: `${(ring[2] / WEB.w) * 100}%`, height: `${(ring[3] / WEB.h) * 100}%` }}
              />
            )}
            {children}
          </div>
          <span className="lf-notch" />
        </div>
        <div className="lf-base" />
      </div>
    </div>
  );
}
