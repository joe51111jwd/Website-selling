// The film player (src/site/player): a time-driven, pausable, seekable timeline for scenes that
// play like a film (One Day's ride; Five apps' walkthrough). See ./player.ts for the model.
//
//   const p = new Player({ name: "ride", duration, chapters, cues, reduced });
//   p.track(el, [{ t: 0, opacity: 0 }, { t: 1200, opacity: 1, ease: EASE.out }]);  // WAAPI on the clock
//   registerPoses("day", keys, { clock: p.sceneClock });                          // the Stage on the clock
//   const hold = holdPage({ y: () => sceneY("day", 0), onExit: … });              // the page held while it plays
//   bindPlayerKeys(p, { active, onSkip });                                         // Space / ← → / Esc
//   <Controls player={p} copy={…} onPlay onPause onSkip onReplay onChapter />     // the controls
//   usePlayer(p) → { state, reason, beat, chapter, started, completed }
export { Player, EASE, presence, type Chapter, type PauseReason, type PlayerOpts, type PlayerState, type TrackFrame } from "./player";
export { holdPage, type Hold, type HoldExit } from "./hold";
export { bindPlayerKeys } from "./keys";
export { usePlayer, type PlayerView } from "./usePlayer";
export { Controls, type ControlsCopy } from "./Controls";
