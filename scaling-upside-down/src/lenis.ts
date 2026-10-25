// The page's smooth scroller, for parts that need to pause it (the use notice dialog).
import type Lenis from "lenis";

export let lenis: Lenis | null = null;
export const setLenis = (l: Lenis | null) => {
  lenis = l;
};
