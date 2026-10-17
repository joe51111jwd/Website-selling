// Expanding service panels: one open at a time. Click or keyboard opens a panel; on wide
// screens, resting the pointer on a spine opens it too.
import { finePointer } from './frame';

export function initPanels() {
  document.querySelectorAll<HTMLElement>('[data-panels]').forEach((root) => {
    const panels = [...root.querySelectorAll<HTMLElement>('.panel')];
    const wide = matchMedia('(min-width: 1000px)');

    let openedAt = 0;
    const open = (i: number) => {
      openedAt = performance.now();
      panels.forEach((p, j) => {
        const on = i === j;
        p.classList.toggle('is-open', on);
        p.querySelector('.spine')!.setAttribute('aria-expanded', String(on));
        const body = p.querySelector<HTMLElement>('.panel-body')!;
        body.inert = !on;
      });
    };

    panels.forEach((p, i) => {
      const spine = p.querySelector<HTMLButtonElement>('.spine')!;
      spine.addEventListener('click', () => {
        // on phones a second tap folds the panel away again
        if (!wide.matches && p.classList.contains('is-open')) {
          p.classList.remove('is-open');
          spine.setAttribute('aria-expanded', 'false');
          p.querySelector<HTMLElement>('.panel-body')!.inert = true;
        } else open(i);
      });
      // Hover opens a panel only when the mouse actually moves onto its spine, never because
      // the panels slid under a resting cursor while another one was opening
      if (finePointer) {
        let timer = 0;
        spine.addEventListener('pointermove', () => {
          if (!wide.matches || timer || p.classList.contains('is-open')) return;
          if (performance.now() - openedAt < 950) return;
          timer = window.setTimeout(() => {
            timer = 0;
            open(i);
          }, 160);
        });
        spine.addEventListener('pointerleave', () => {
          clearTimeout(timer);
          timer = 0;
        });
      }
    });

    open(0);
  });
}
