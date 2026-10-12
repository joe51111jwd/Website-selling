// 4 · Your number (BRIEF §4): "What's loose time costing you?" Drag the crew size, see the
// visitor's own number, carry it into the popup (openSignup({ estimate })). STUB: owner fills.

import { NUMBER } from "../../content/copy";
import { Scene } from "../scene/Scene";
import { Stub } from "../ui/Stub";

export default function YourNumber() {
  return (
    <Scene id="number" pinnedViewports={1} label="Your number" className="stub-scene">
      <Stub id="number" title={NUMBER.title} note="Stub: calculator. Devices are hidden here." />
    </Scene>
  );
}
