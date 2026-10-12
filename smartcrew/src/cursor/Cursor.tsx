import "./cursor.css";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { startCursor } from "./engine";
import { FINE_POINTER } from "./magnet";

export { useMagnetic, attachMagnet } from "./magnet";
export { writeLoupeQuad } from "./loupe";
export type { CursorMode } from "./engine";

// The geofence cursor. Mount once, anywhere (it portals to <body>):
//   <Cursor />
// Elements opt in with data attributes (see CURSOR.md):
//   data-cursor="cta|link|drag|loupe|view|text|hide|default"  data-cursor-label="Free trial"
//   data-cursor-tone="dark" on a section with a dark ground
// Only on mouse/trackpad devices; nothing renders on touch, in forced-colors mode or in print.

export default function Cursor() {
  const [on, setOn] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (new URLSearchParams(location.search).has("nocursor")) return;
    const fine = matchMedia(FINE_POINTER);
    const forced = matchMedia("(forced-colors: active)");
    const sync = () => setOn(fine.matches && !forced.matches);
    sync();
    fine.addEventListener("change", sync);
    forced.addEventListener("change", sync);
    return () => {
      fine.removeEventListener("change", sync);
      forced.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    if (!on || !root.current) return;
    return startCursor(root.current);
  }, [on]);

  if (!on) return null;
  return createPortal(
    <div className="cur-root" ref={root} aria-hidden="true" data-visible="0" data-mode="default" data-tone="light">
      <div className="cur-loupe">
        <div className="cur-loupe-img" />
      </div>
      <div className="cur-ring">
        <svg className="cur-svg" width="1" height="1" overflow="visible">
          <rect className="cur-shape" x="-17" y="-17" width="34" height="34" rx="17" />
        </svg>
        <svg className="cur-hint" width="12" height="16" viewBox="0 0 12 16">
          <path d="M6 1.5v12M1.5 9.5 6 14l4.5-4.5" />
        </svg>
        <span className="cur-label">
          <svg className="cur-play" width="9" height="10" viewBox="0 0 9 10">
            <path d="M1 1.2v7.6a.5.5 0 0 0 .76.43l6.3-3.8a.5.5 0 0 0 0-.86L1.76.77A.5.5 0 0 0 1 1.2Z" />
          </svg>
          <span className="cur-label-text">View</span>
        </span>
        <svg className="cur-arrow cur-arrow-l" width="7" height="12" viewBox="0 0 7 12">
          <path d="M6 1 1 6l5 5" />
        </svg>
        <svg className="cur-arrow cur-arrow-r" width="7" height="12" viewBox="0 0 7 12">
          <path d="m1 1 5 5-5 5" />
        </svg>
        <span className="cur-tag">
          <span className="cur-tag-in">
            <i className="cur-tag-dot" />
            <span className="cur-tag-text" />
          </span>
        </span>
      </div>
      <div className="cur-dot" />
      <div className="cur-ripple">
        <svg width="1" height="1" overflow="visible">
          <rect />
        </svg>
      </div>
    </div>,
    document.body,
  );
}
