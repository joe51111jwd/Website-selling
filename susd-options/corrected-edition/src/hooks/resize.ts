import { useEffect, useState } from 'react';

/** A counter that bumps after resizes settle (debounced 120 ms). Use it as an effect dependency. */
export function useResizeKey() {
  const [k, setK] = useState(0);
  useEffect(() => {
    let t = 0;
    let w = window.innerWidth;
    let h = window.innerHeight;
    const on = () => {
      clearTimeout(t);
      t = window.setTimeout(() => {
        // Ignore the phone toolbar height wobble; re-measure on real size changes.
        if (window.innerWidth === w && Math.abs(window.innerHeight - h) < 120) return;
        w = window.innerWidth;
        h = window.innerHeight;
        setK((x) => x + 1);
      }, 120);
    };
    window.addEventListener('resize', on);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', on);
    };
  }, []);
  return k;
}
