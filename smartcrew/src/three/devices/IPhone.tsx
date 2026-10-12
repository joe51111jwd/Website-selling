import { useLayoutEffect, useMemo } from "react";
import { pill, roundedPlane, slab } from "../geo";
import { backGlass, bezel, deepBlack, lens, titanium, type Finish } from "../materials";
import { screenMaterial, useScreenTexture, type ScreenSource } from "../screen";

// iPhone 16 Pro at real proportions (1 unit = 10 cm), standing upright and centred on the
// origin, screen towards +z. Has its buttons and camera plateau so a side view reads right.

const W = 0.715;
const H = 1.496;
const T = 0.0825;
const SW = 0.6687;
const SH = 1.4537;
export const IPHONE_SCREEN_ASPECT = SW / SH;

const BUTTONS: { side: -1 | 1; y: number; len: number }[] = [
  { side: -1, y: 0.43, len: 0.07 }, // action
  { side: -1, y: 0.28, len: 0.12 }, // volume up
  { side: -1, y: 0.13, len: 0.12 }, // volume down
  { side: 1, y: 0.3, len: 0.18 }, // side button
  { side: 1, y: -0.2, len: 0.11 }, // camera control
];

export type IPhoneProps = { screen?: ScreenSource; finish?: Finish; align?: number; island?: boolean };

export function IPhone({ screen, finish = "black", align = 0, island = true }: IPhoneProps) {
  const tex = useScreenTexture(screen, IPHONE_SCREEN_ASPECT, align);
  const screenMat = useMemo(() => screenMaterial(tex), [tex]);
  useLayoutEffect(() => () => screenMat.dispose(), [screenMat]);

  const geo = useMemo(
    () => ({
      body: slab(W, H, T, 0.112, 0.014),
      glass: roundedPlane(W - 0.008, H - 0.008, 0.106),
      screen: roundedPlane(SW, SH, 0.088),
      island: roundedPlane(0.21, 0.062, 0.031),
      back: roundedPlane(W - 0.01, H - 0.01, 0.106),
      plateau: slab(0.37, 0.37, 0.016, 0.075, 0.006),
      buttons: BUTTONS.map((b) => pill(b.len, 0.012, 0.03)),
    }),
    [],
  );
  const ti = titanium(finish);

  return (
    <group>
      <mesh geometry={geo.body} material={ti} castShadow />
      <mesh geometry={geo.glass} material={bezel()} position={[0, 0, T / 2 + 0.0004]} />
      <mesh geometry={geo.screen} material={screenMat} position={[0, 0, T / 2 + 0.0008]} />
      {island && <mesh geometry={geo.island} material={deepBlack()} position={[0, SH / 2 - 0.049, T / 2 + 0.0012]} />}
      {BUTTONS.map((b, i) => (
        <mesh key={i} geometry={geo.buttons[i]} material={ti} position={[b.side * (W / 2 + 0.002), b.y, 0]} rotation={[0, Math.PI / 2, 0]} />
      ))}
      {/* back: frosted glass, camera plateau and three lenses */}
      <mesh geometry={geo.back} material={backGlass(finish)} position={[0, 0, -T / 2 - 0.0004]} rotation={[0, Math.PI, 0]} />
      <group position={[-W / 2 + 0.04 + 0.185, H / 2 - 0.04 - 0.185, -T / 2 - 0.008]} rotation={[0, Math.PI, 0]}>
        <mesh geometry={geo.plateau} material={backGlass(finish)} />
        {[
          [0.08, 0.085],
          [0.08, -0.085],
          [-0.085, 0],
        ].map(([x, y], i) => (
          <group key={i} position={[x, y, 0.012]} rotation={[Math.PI / 2, 0, 0]}>
            <mesh material={ti}>
              <cylinderGeometry args={[0.066, 0.068, 0.02, 40]} />
            </mesh>
            <mesh material={lens()} position={[0, 0.0105, 0]}>
              <cylinderGeometry args={[0.048, 0.048, 0.002, 40]} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}
