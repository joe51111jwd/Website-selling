// Public API of the Stage. Scenes import from here (see scratchpad/design/v2/API.md). Nothing in
// it pulls in three.js: the Stage itself (./Stage.tsx) is a lazy chunk that App loads.
export { StageAnchor } from "./StageAnchor";
export {
  registerPoses,
  setScreen,
  clearScreen,
  pulse,
  registerLiveScreen,
  updateLiveScreen,
  setOverlay,
  updateOverlay,
  reveal,
  onStatus,
  status,
  sceneProgress,
  sceneOnScreen,
  sceneY,
  scheduleMeasure,
  onStageFrame,
  reducedMotion,
  coarse,
  phone,
} from "./store";
export type { StageFrame, FrameHook, OverlaySlot } from "./store";
export { exitKeys, returnKeys, type ExitOptions } from "./recipes";
export type { Box, DeviceId, DevicePose, FocusSpec, Pose, PoseKey, PulseSpec, Ease, EaseName } from "./types";
