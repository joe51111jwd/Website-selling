/* fx injects its own small stylesheet so it never needs edits outside src/fx/.
   Everything is low-specificity (:where) so site-core can override freely. */

const CSS = `
:where(.fx-canvas){display:block;}
:where(canvas[data-fx="chrome"],canvas[data-fx="caustics"]){background:#0B0B0F;}
:where(canvas[data-fx][data-fx-theme="bone"]){background:#EFEBE3;}

/* no WebGL: still on brand */
:where(.fx-fallback--chrome){
  background:
    radial-gradient(75% 65% at 50% 50%, transparent 30%, #0B0B0F 78%),
    radial-gradient(45% 35% at 30% 25%, rgba(239,235,227,.10), transparent 70%),
    radial-gradient(40% 30% at 72% 72%, rgba(43,59,255,.16), transparent 70%),
    radial-gradient(circle, transparent 8px, rgba(201,204,211,.16) 9px, rgba(201,204,211,.16) 11px, transparent 12px) 0 0/26px 26px,
    radial-gradient(circle, transparent 8px, rgba(201,204,211,.10) 9px, rgba(201,204,211,.10) 11px, transparent 12px) 13px 13px/26px 26px,
    #111116;
}
:where(.fx-fallback--caustics){
  background:
    radial-gradient(40% 35% at 28% 45%, rgba(255,170,80,.08), transparent 70%),
    radial-gradient(35% 30% at 70% 52%, rgba(43,59,255,.10), transparent 70%),
    #0B0B0F;
}
:where(.fx-fallback--chrome[data-fx-theme="bone"]){
  background:
    radial-gradient(75% 65% at 50% 50%, transparent 30%, #EFEBE3 78%),
    radial-gradient(circle, transparent 8px, rgba(42,42,49,.14) 9px, rgba(42,42,49,.14) 11px, transparent 12px) 0 0/26px 26px,
    radial-gradient(circle, transparent 8px, rgba(42,42,49,.09) 9px, rgba(42,42,49,.09) 11px, transparent 12px) 13px 13px/26px 26px,
    #E4DFD6;
}
:where(.fx-fallback--caustics[data-fx-theme="bone"]){background:#EFEBE3;}

/* grain overlay */
:where(.fx-grain){
  pointer-events:none;
  background-repeat:repeat;
  background-size:160px 160px;
  opacity:var(--fx-grain-opacity,.07);
  mix-blend-mode:overlay;
  animation:fx-grain 1s steps(10) infinite;
}
:where(.fx-grain--injected){position:fixed;inset:-160px;width:auto;height:auto;z-index:2147483000;}
:where(.fx-grain--still){animation:none;}
@keyframes fx-grain{
  0%{transform:translate(0,0)}10%{transform:translate(-37px,23px)}20%{transform:translate(51px,-61px)}
  30%{transform:translate(-83px,97px)}40%{transform:translate(17px,-29px)}50%{transform:translate(-113px,41px)}
  60%{transform:translate(71px,131px)}70%{transform:translate(-11px,-89px)}80%{transform:translate(103px,7px)}
  90%{transform:translate(-59px,-127px)}100%{transform:translate(0,0)}
}

/* sequence: skeleton while nothing is drawable, never a broken image */
:where(.fx-seq--loading,.fx-seq--empty){
  background:
    linear-gradient(100deg, transparent 30%, rgba(201,204,211,.10) 50%, transparent 70%) 0 0/250% 100%,
    radial-gradient(50% 45% at 50% 55%, rgba(201,204,211,.08), transparent 70%);
  animation:fx-skel 1.6s linear infinite;
}
:where(.fx-seq--empty){animation:none;}
@keyframes fx-skel{from{background-position:150% 0,0 0}to{background-position:-100% 0,0 0}}
@media (prefers-reduced-motion: reduce){
  :where(.fx-grain,.fx-seq--loading){animation:none;}
}
`;

let el = null;
export function injectStyles() {
  if (el || typeof document === 'undefined') return;
  el = document.createElement('style');
  el.dataset.fx = 'styles';
  el.textContent = CSS;
  document.head.appendChild(el);
}
export function removeStyles() {
  el?.remove();
  el = null;
}
