// Real device models. Until a file is listed here, each device is drawn by its stand-in in
// ./devices. To use a real model, put the .glb in public/models/ and fill in its entry:
//
//   url       path under public/, e.g. "models/macbook-pro.glb"
//   screen    name of the mesh (or of its material) that is the display glass; open
//             ?sandbox=devices&log=1 and the console prints every mesh name to choose from
//   flipY     true if the screen image shows upside down
//   scale     multiplier to reach real size at 1 unit = 10 cm (a MacBook Pro 14 is 3.126 wide)
//   rotation  [x, y, z] radians to stand it the same way as the stand-ins (screen towards +z,
//             resting on y = 0, centred on x)
//   lid       (MacBook only) the node that holds the lid, so it can open and close

export type DeviceKind = "macbook" | "iphone" | "display";

export type ModelSpec = {
  url: string;
  screen: string;
  flipY?: boolean;
  scale?: number;
  rotation?: [number, number, number];
  position?: [number, number, number];
  lid?: string;
  /** Lid hinge axis rotation at which the model's lid sits as exported (degrees open). */
  lidRestAngle?: number;
};

export const MODELS: Partial<Record<DeviceKind, ModelSpec>> = {
  // macbook: { url: "models/macbook-pro.glb", screen: "Screen", lid: "Lid", lidRestAngle: 90 },
  // iphone: { url: "models/iphone.glb", screen: "Screen" },
  // display: { url: "models/studio-display.glb", screen: "Screen" },
};
