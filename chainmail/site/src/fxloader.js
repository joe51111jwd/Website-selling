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
    // initFX never throws without WebGL2: each GL canvas falls back on its own (.fx-fallback). If none of them
    // got a context, the page is effectively fx-less: turn on the .no-fx CSS (made fallback, no grain).
    const gl = [...document.querySelectorAll('canvas[data-fx="chrome"], canvas[data-fx="caustics"]')];
    const noGL = gl.length > 0 && gl.every((el) => el.classList.contains('fx-fallback') || fx.instances.get(el)?.failed);
    html.classList.add(noGL ? 'no-fx' : 'has-fx');
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
