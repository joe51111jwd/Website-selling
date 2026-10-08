// The inline head script (brief 8.3a). Owner: A1.
// Runs before first paint: swaps `no-js` for `js`, adds `rm` (reduced motion) and `capture`.
// vite.config.ts inlines HEAD_SCRIPT verbatim into <head>; scripts/prerender.mjs hashes the exact
// inline text for the CSP (public/_headers -> dist/_headers). Keep it ES5, tiny and side-effect only.
//
// MOTION rule: an explicit stored choice ('on' / 'off') wins; with no stored choice,
// `prefers-reduced-motion: reduce` turns motion OFF. (A visitor who switched MOTION ON keeps it.)

/** localStorage key for the MOTION preference: 'on' | 'off'. */
export const MOTION_STORAGE_KEY = 'hrcg-motion';

export const HEAD_SCRIPT =
  "(function(d,w){var c=d.documentElement.classList,rm=false,s=null;c.remove('no-js');c.add('js');" +
  "try{s=w.localStorage.getItem('" +
  MOTION_STORAGE_KEY +
  "')}catch(e){}" +
  "if(s==='off'){rm=true}else if(s!=='on'){try{rm=w.matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}}" +
  "if(rm){c.add('rm')}" +
  "if(/[?&]capture(=|&|$)/.test(w.location.search)){c.add('capture')}" +
  "})(document,window)";
