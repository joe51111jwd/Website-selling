// Try it on desktop: the live crew app laid exactly over the 3D iPhone's screen once the scene has
// settled (TryDesk shows it while the phone holds still, and the Stage's still of the same screen
// is under it, so the hand-over is seamless). Native 402 × 874 px, scaled onto the screen.

import { StatusBar } from "../../screens/kit";
import { TryApp, type TryAppProps } from "./TryApp";
import "./try-phone.css";

export default function TryScreen({ sx, sy, ...app }: TryAppProps & { sx: number; sy: number }) {
  return (
    <div className="try-dom-ui try-scr-ui" style={{ transform: `scale(${sx}, ${sy})` }}>
      <div className="sc try-dom-status">
        <StatusBar />
      </div>
      <div className="try-dom-app tp-ui">
        <TryApp {...app} />
      </div>
    </div>
  );
}
