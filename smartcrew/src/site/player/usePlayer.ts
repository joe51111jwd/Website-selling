// React's view of a Player: its state, why it stopped, and the beat / chapter, re-rendering only
// when one of those changes (a handful of times per chapter), never per frame.

import { useRef, useSyncExternalStore } from "react";
import type { Player, PauseReason, PlayerState } from "./player";

export type PlayerView = {
  state: PlayerState;
  reason: PauseReason | null;
  beat: number;
  chapter: number;
  started: boolean;
  completed: boolean;
};

export function usePlayer(p: Player): PlayerView {
  const snap = useRef<PlayerView | null>(null);
  const read = (): PlayerView => {
    const t = p.time();
    const next: PlayerView = { state: p.state, reason: p.reason, beat: p.beatAt(t), chapter: p.chapterAt(t), started: p.started, completed: p.completed };
    const s = snap.current;
    if (s && s.state === next.state && s.reason === next.reason && s.beat === next.beat && s.chapter === next.chapter && s.started === next.started && s.completed === next.completed) return s;
    snap.current = next;
    return next;
  };
  return useSyncExternalStore(
    (f) => {
      const a = p.on("state", f);
      const b = p.on("beat", f);
      return () => {
        a();
        b();
      };
    },
    read,
    read,
  );
}
