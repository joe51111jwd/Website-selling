// A small label that follows the cursor over things you can drag, draw on or open.
// Mouse and trackpad only; the system cursor stays visible.
import { finePointer, still } from './frame';

export function initCursor() {
  if (!finePointer || !document.querySelector('[data-cursor]')) return;
  const dot = document.createElement('div');
  dot.className = 'cursor';
  dot.setAttribute('aria-hidden', 'true');
  dot.innerHTML = '<span></span>';
  document.body.appendChild(dot);
  const label = dot.firstElementChild as HTMLElement;

  let x = -100;
  let y = -100;
  let cx = x;
  let cy = y;
  let running = false;

  const loop = () => {
    cx += (x - cx) * (still ? 1 : 0.22);
    cy += (y - cy) * (still ? 1 : 0.22);
    dot.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    if (Math.abs(x - cx) + Math.abs(y - cy) > 0.3) requestAnimationFrame(loop);
    else running = false;
  };

  addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse') return;
      x = e.clientX;
      y = e.clientY;
      const target = (e.target as Element | null)?.closest<HTMLElement>('[data-cursor]');
      if (target) {
        label.textContent = target.dataset.cursor ?? '';
        dot.classList.add('on');
        dot.classList.toggle('pen', target.dataset.cursor === 'Draw');
      } else {
        dot.classList.remove('on', 'pen');
      }
      if (!running) {
        running = true;
        requestAnimationFrame(loop);
      }
    },
    { passive: true },
  );
  document.addEventListener('pointerleave', () => dot.classList.remove('on'));
}
