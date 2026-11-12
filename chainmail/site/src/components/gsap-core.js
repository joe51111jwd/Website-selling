// gsap core + the reduced-motion flag, without ScrollTrigger / SplitText / Lenis.
// The builder imports this directly so its chunk does not carry the index page's scroll stack.
import { gsap } from 'gsap';

export { gsap };
export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
