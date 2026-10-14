// Try it on desktop without the 3D phone (no WebGL, a lost context, or the models still on their
// way): the same live app in a plain phone frame at the 3D phone's size and place, so the scene
// still works (and reads the same). It scrolls in with the page (no tilt); its screen is off until
// the scene's wake (./wake.ts), then the black plate fades and the app is on.

import { StatusBar } from "../../screens/kit";
import { TryApp, type TryAppProps } from "./TryApp";
import "./try-phone.css";

/** The iPhone model's body and screen, device units (see poses.ts / TryDesk.tsx). */
const BODY = { w: 0.79, h: 1.6336, r: 0.125 };
const SCREEN_W = 0.7261;

export default function TryDomPhone({ k, awake, ...app }: TryAppProps & { k: number; awake: boolean }) {
  const w = BODY.w * k;
  const h = BODY.h * k;
  const sw = SCREEN_W * k;
  const scale = sw / 402;
  const sh = 874 * scale;
  return (
    <div className="try-dom" style={{ width: w, height: h, borderRadius: BODY.r * k }}>
      <div className="try-dom-screen" style={{ width: sw, height: sh, borderRadius: BODY.r * k * 0.82 }}>
        <div className="try-dom-ui" style={{ transform: `scale(${scale})` }}>
          <div className="sc try-dom-status">
            <StatusBar />
          </div>
          <div className="try-dom-app tp-ui">
            <TryApp {...app} />
          </div>
        </div>
        <div className={`try-dom-plate${awake ? " is-awake" : ""}`} aria-hidden="true" />
      </div>
    </div>
  );
}
