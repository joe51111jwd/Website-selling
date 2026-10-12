// 6 · Five apps → one (BRIEF §6), pinned ~2.5 screens: five app tiles drift round the devices and
// fly into them as you scroll; the screens light up with one dashboard. STUB: owner fills.

import { useMemo } from "react";
import { APPS } from "../../content/copy";
import { Scene } from "../scene/Scene";
import { StageAnchor } from "../../three/stage/StageAnchor";
import type { PoseKey } from "../../three/stage/types";
import { Stub } from "../ui/Stub";

export default function FiveApps() {
  const poses = useMemo<PoseKey[]>(
    () => [
      {
        at: 0,
        anchor: "apps",
        frame: [6, 3.6],
        macbook: { x: -0.3, y: 0, z: 0, rx: 10, ry: 0, rz: 0, s: 1, screen: "web-dashboard" },
        iphone: { x: 2.0, y: -0.35, z: 0.8, rx: 4, ry: -10, rz: -2, s: 1.05, screen: "phone-working" },
        float: 0.3,
        look: 0.5,
      },
      { at: 1, anchor: "apps", macbook: { x: -0.3, y: 0, z: 0, rx: 10, ry: 0, s: 1 }, iphone: { x: 2.0, y: -0.35, z: 0.8, rx: 4, ry: -10, s: 1.05 } },
    ],
    [],
  );
  return (
    <Scene id="apps" pinnedViewports={2.5} poses={poses} label="Five apps, one system" className="stub-scene">
      <Stub id="apps" title={APPS.title} note="Stub: the five app tiles fly into the devices (anchor “apps”)." />
      <StageAnchor id="apps" className="stub-anchor" />
    </Scene>
  );
}
