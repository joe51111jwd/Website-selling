// 3 · Try it (BRIEF §3): "Your guys won't fight this one." The iPhone comes forward, centred and
// large; a real, tappable Clock In button sits over the phone's Clock In circle. STUB: owner fills.

import { useMemo } from "react";
import { TRY } from "../../content/copy";
import { Scene } from "../scene/Scene";
import { StageAnchor } from "../../three/stage/StageAnchor";
import type { PoseKey } from "../../three/stage/types";
import { Stub } from "../ui/Stub";

export default function TryIt() {
  const poses = useMemo<PoseKey[]>(
    () => [
      {
        at: 0,
        anchor: "try",
        frame: [3, 2.2],
        iphone: { x: 0, y: 0, z: 0.5, rx: 0, ry: 0, rz: 0, s: 1.25, screen: "phone-home" },
        macbook: { show: 0 },
        float: 0.4,
        look: 0.5,
        ease: "inOut",
      },
      { at: 1, anchor: "try", iphone: { x: 0, y: 0, z: 0.5, rx: 0, ry: 0, rz: 0, s: 1.25 }, macbook: { show: 0 } },
    ],
    [],
  );
  return (
    <Scene id="try" pinnedViewports={1} poses={poses} label="Try it" className="stub-scene">
      <Stub id="try" title={TRY.title} note="Stub: the tappable Clock In goes over the phone (anchor “try”)." />
      <StageAnchor id="try" className="stub-anchor" />
    </Scene>
  );
}
