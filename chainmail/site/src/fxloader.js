// fx bootstrap. Statically imports the fx layer (src/fx, raw WebGL2) and mounts every [data-fx] element.
// Resolves to the fx API, or null when fx could not start (the CSS fallbacks under `.no-fx` take over).
// Kept promise-shaped so section modules can chain on it without caring whether fx is up yet.
import { initFX } from './fx/index.js';

let fxPromise = null;

export function loadFX() {
  if (fxPromise) return fxPromise;
  const html = document.documentElement;
  let fx = null;
  try {
    fx = initFX();
    html.classList.add('has-fx');
    // every fx element tints to the section it sits in (hero, made, spirits are ink; anything else follows its section)
    document.querySelectorAll('canvas[data-fx], div[data-fx="grain"]').forEach((el) => {
      const theme = el.closest('[data-theme]')?.dataset.theme;
      if (theme === 'ink' || theme === 'bone') fx.setTheme(el, theme);
    });
  } catch (err) {
    console.warn('[fx] unavailable, using CSS fallbacks', err);
    html.classList.add('no-fx');
    fx = null;
  }
  fxPromise = Promise.resolve(fx);
  return fxPromise;
}
