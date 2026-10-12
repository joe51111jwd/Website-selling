// True from the first time an element is `threshold` on screen; true at once with reduced motion
// or without IntersectionObserver (so nothing ever waits on it to be readable).

import { useEffect, useState, type RefObject } from "react";
import { reducedMotion } from "../../three/stage";

export function useSeen(ref: RefObject<HTMLElement | null>, threshold = 0.3) {
  const [seen, setSeen] = useState(() => reducedMotion || typeof IntersectionObserver === "undefined");
  useEffect(() => {
    const node = ref.current;
    if (seen || !node) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        setSeen(true);
      },
      { threshold },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [ref, seen, threshold]);
  return seen;
}
