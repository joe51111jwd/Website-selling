import { ContactShadows, Environment, Lightformer } from "@react-three/drei";

// A product-photography light rig built from soft boxes, so the aluminium has something to
// reflect. Nothing is fetched: the environment map is rendered from these panels once.

export function Studio({ shadow = true, shadowY = 0, shadowScale = 14 }: { shadow?: boolean; shadowY?: number; shadowScale?: number }) {
  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight position={[4, 8, 6]} intensity={1.1} />
      <Environment resolution={512} frames={1}>
        <color attach="background" args={["#f2efe9"]} />
        {/* big overhead softbox */}
        <Lightformer form="rect" intensity={2.4} position={[0, 7, 2]} rotation-x={Math.PI / 2} scale={[14, 6, 1]} />
        {/* key from front-left, fill from right, warm kicker behind */}
        <Lightformer form="rect" intensity={3} position={[-7, 2.5, 5]} rotation-y={Math.PI / 3.2} scale={[4, 6, 1]} />
        <Lightformer form="rect" intensity={1.4} position={[7, 2, 3]} rotation-y={-Math.PI / 3} scale={[3, 6, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#ffd7b0" position={[0, 2, -8]} scale={[12, 3, 1]} />
        {/* thin strips that draw crisp highlights along edges */}
        <Lightformer form="rect" intensity={4} position={[-3, 5, 6]} rotation-x={-Math.PI / 4} scale={[8, 0.25, 1]} />
        <Lightformer form="rect" intensity={4} position={[3, 1, 7]} scale={[0.25, 8, 1]} />
      </Environment>
      {shadow && <ContactShadows position={[0, shadowY, 0]} opacity={0.42} scale={shadowScale} blur={2.6} far={3} resolution={1024} color="#2a2118" frames={1} />}
    </>
  );
}
