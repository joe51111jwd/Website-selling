// 3 · Try it (BRIEF §3, beat 4): "Your guys won't fight this one."
// Desktop: the 3D iPhone comes forward, centred and large, inside the jobsite's geofence; a real
// button sits exactly on its Clock In circle. Phones (PHONE MODE): one screen where the visitor's
// own phone becomes the SmartCrew app (./TryPhone.tsx; no 3D, nothing scroll-driven). Either way:
// tap → clocked in, the timer runs → "That's the whole training."

import { lazy, Suspense } from "react";
import { Scene } from "../scene/Scene";
import { usePhoneLite } from "../phone";
import { TryDesk } from "./TryDesk";
import "./try.css";
import "./glass.css";

// the phone layout carries the app's own UI kit (Inter, the screens' CSS): only phones load it
const TryPhone = lazy(() => import("./TryPhone"));

export default function TryIt() {
  return usePhoneLite() ? <TryItPhone /> : <TryItDesk />;
}

// Round 4: the page is 2D, so desktop shows the live app in a DOM phone (./TryDomPhone.tsx) that
// takes taps wherever it sits on screen (the agency owner: "You should be able to click it
// whenever"); the scene is one screen tall and nothing holds the page.
function TryItDesk() {
  return (
    <Scene id="try" pinnedViewports={1} stage="keep" label="Try the crew app" className="try try--desk">
      <TryDesk />
    </Scene>
  );
}

function TryItPhone() {
  return (
    <Scene id="try" pinnedViewports={1} stage="keep" label="Try the crew app" className="try try--phone">
      {/* data-hides-sticky: the app fills the screen here, so the phone's sticky CTA bar steps
          aside (it must be on an element that exists at first render, hence this wrapper) */}
      <div className="try-phone-wrap" data-hides-sticky>
        <Suspense fallback={null}>
          <TryPhone />
        </Suspense>
      </div>
    </Scene>
  );
}
