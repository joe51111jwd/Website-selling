// Your number: the meter catches up with the inputs once they settle (SCROLL_SHOTS §2). The
// formula updates at once as plain text; the wheels wait until nothing has changed for 250 ms (and
// nothing is being dragged), so a drag across the crew is one roll at the end, not a slot machine.

import { useEffect, useState } from "react";
import { reducedMotion } from "../../three/stage/store";

/** `value`, once it has held still for `ms` with `hold` off. Reduced motion: at once. */
export function useSettled<T>(value: T, hold = false, ms = 250): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    if (hold || Object.is(value, v)) return;
    const t = window.setTimeout(() => setV(value), reducedMotion ? 0 : ms);
    return () => window.clearTimeout(t);
  }, [value, hold, v, ms]);
  return v;
}
