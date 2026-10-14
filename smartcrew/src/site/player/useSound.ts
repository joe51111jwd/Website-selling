// React's view of a Soundtrack: on / locked / ready, re-rendering only when one changes.

import { useSyncExternalStore } from "react";
import type { Soundtrack, SoundView } from "./soundtrack";

const NONE: SoundView = { on: false, locked: true, ready: false };

export function useSound(st: Soundtrack | null): SoundView {
  return useSyncExternalStore(
    (f) => (st ? st.subscribe(f) : () => {}),
    () => (st ? st.snapshot() : NONE),
    () => NONE,
  );
}
