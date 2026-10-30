import { tick } from './ticker';
import { isCalm } from '../hooks/media';

// The lamp: --light-angle is 135° ± 4°, following the pointer's x (lerp 0.06).
// It rotates each sheet's oversized raking-light layer (a compositor-only transform).
const layers = new Set<HTMLElement>();
let target = 135;
let cur = 135;
let running = false;

function apply() {
  const d = (cur - 135).toFixed(3);
  for (const el of layers) el.style.transform = `rotate(${d}deg)`;
}

function step() {
  cur += (target - cur) * 0.06;
  apply();
  if (Math.abs(target - cur) < 0.01) {
    cur = target;
    apply();
    running = false;
    return false;
  }
  return true;
}

export function registerLight(el: HTMLElement) {
  layers.add(el);
  el.style.transform = `rotate(${(cur - 135).toFixed(3)}deg)`;
  return () => {
    layers.delete(el);
  };
}

if (typeof window !== 'undefined') {
  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse' || isCalm()) return;
      target = 135 + ((e.clientX / window.innerWidth) * 2 - 1) * 4;
      if (!running) {
        running = true;
        tick(step);
      }
    },
    { passive: true },
  );
}
