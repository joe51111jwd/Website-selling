// 3 · Try it (BRIEF §3, beat 4): "Your guys won't fight this one."
// Desktop: the 3D iPhone comes forward, centred and large, inside the jobsite's geofence; a real
// button sits exactly on its Clock In circle. Phones: the section becomes the SmartCrew app on the
// visitor's own phone. Either way: tap → clocked in, the timer runs → "That's the whole training."

import { lazy, Suspense, useMemo } from "react";
import { Scene } from "../scene/Scene";
import { phone } from "../../three/stage/store";
import { tryPoses } from "./poses";
import { TryDesk } from "./TryDesk";
import "./try.css";

// the phone layout carries the app's own UI kit (Inter, the screens' CSS): only phones load it
const TryPhone = lazy(() => import("./TryPhone"));

export default function TryIt() {
  // phones: no devices here (the page itself is the phone), so no keys → the Stage hides them
  const poses = useMemo(() => (phone ? undefined : tryPoses()), []);
  return (
    <Scene
      id="try"
      pinnedViewports={phone ? 2.4 : 1.7}
      poses={poses}
      label="Try the crew app"
      className={phone ? "try try--phone" : "try try--desk"}
    >
      {phone ? (
        // data-hides-sticky: the app fills the screen here, so the phone's sticky CTA bar steps
        // aside (it must be on an element that exists at first render, hence this wrapper)
        <div className="try-phone-wrap" data-hides-sticky>
          <Suspense fallback={null}>
            <TryPhone />
          </Suspense>
        </div>
      ) : (
        <TryDesk />
      )}
    </Scene>
  );
}
