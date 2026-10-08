// System barrel (brief 9.2). Owner: A1. Import from 'src/system' or the individual files.
export { useStageProgress, type StageProgressOptions, type EdgePair } from './useStageProgress';
export { useTier, tierStore, type Tier } from './tier';
export { usePrefs, prefsStore, motionEnabled, type Prefs } from './prefs';
export { sheetStore, useSheet, type SheetState } from './sheetStore';
export { LoopVideo, sortSources, type LoopVideoProps } from './LoopVideo';
export { Picture, type PictureProps } from './Picture';
export { videoManager, MAX_DECODERS, type VideoState, type RegisterOptions } from './VideoManager';
export { lenisScrollTo, getLenis, lockScroll, unlockScroll, type ScrollToOptions } from './lenis';
export { registerCaptureScene, isCapture, type CaptureScene } from './capture';
export { announce } from './announce';
export { onScroll, onLayout } from './scroll';
export * from './easing';
export { HEAD_SCRIPT, MOTION_STORAGE_KEY } from './headScript';
