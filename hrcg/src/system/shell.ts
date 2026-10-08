// App-shell effects, run once after hydration (never during the first render). Owner: A1.

import { useEffect } from 'react';
import { sheetStore } from './sheetStore';
import { initScrollEngine, getLenis } from './lenis';
import { setMotionAnchorKeeper } from './prefs';
import { tierStore } from './tier';
import { markCaptureReady } from './capture';
import { onLayout } from './scroll';

export function useShellEffects() {
  useEffect(() => {
    sheetStore.scan();
    const stopEngine = initScrollEngine();

    // MOTION toggle keeps the reader on the same sheet (brief 4.3)
    setMotionAnchorKeeper(() => {
      const id = sheetStore.get().current;
      const el = sheetStore.elementOf(id) as HTMLElement | null;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const frac = r.height > 0 ? -r.top / r.height : 0;
      return () => {
        const r2 = el.getBoundingClientRect();
        const top = Math.max(0, r2.top + window.scrollY + frac * r2.height);
        const lenis = getLenis();
        if (lenis) lenis.scrollTo(top, { immediate: true, force: true });
        else window.scrollTo({ top, behavior: 'auto' });
      };
    });

    const offLayout = onLayout(() => tierStore.refresh());

    // late-mounted sheets (lazy owners) register themselves via <SheetTag>; rescan once more
    const t = window.setTimeout(() => sheetStore.scan(), 1500);

    const fontsReady = document.fonts?.ready ?? Promise.resolve();
    fontsReady.then(() => markCaptureReady()).catch(() => markCaptureReady());

    return () => {
      stopEngine();
      setMotionAnchorKeeper(null);
      offLayout();
      window.clearTimeout(t);
    };
  }, []);
}
