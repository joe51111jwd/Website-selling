// The pinned markup story: scroll position becomes a stage from 0 to 5. Stages 0–4 red-pen
// the draft one problem at a time; stage 4–5 turns the slide over to the rewrite.
import { clamp, ease, onScroll, pinProgress, scrollToY, still } from './frame';

export function initStory() {
  if (still) return;
  document.querySelectorAll<HTMLElement>('[data-story]').forEach((story) => {
    const steps = [...story.querySelectorAll<HTMLElement>('.story-step')];
    const tabs = [...story.querySelectorAll<HTMLElement>('.story-tab')];
    const flip = story.querySelector<HTMLElement>('.flip')!;
    const marks = [...story.querySelectorAll<SVGElement>('[data-s]')].map((el) => ({
      el,
      s: Number(el.dataset.s),
      a: Number(el.dataset.a),
      b: Number(el.dataset.b),
      kind: el.classList.contains('ink') ? 'ink' : el.classList.contains('pop') ? 'pop' : 'fade',
    }));
    const STAGES = steps.length;
    let active = -1;

    onScroll(() => {
      const stage = pinProgress(story) * STAGES;

      const now = Math.min(STAGES - 1, Math.floor(stage));
      if (now !== active) {
        active = now;
        steps.forEach((s, i) => s.classList.toggle('is-active', i === now));
        tabs.forEach((t, i) => t.classList.toggle('is-active', i === now));
      }
      tabs.forEach((t, i) => t.style.setProperty('--fill', String(clamp(stage - i))));

      for (const m of marks) {
        const t = clamp((clamp(stage - (m.s - 1)) - m.a) / (m.b - m.a));
        if (m.kind === 'ink') {
          m.el.style.strokeDashoffset = String(1 - t);
        } else if (m.kind === 'pop') {
          // stamps and questions land: big and faint, then pressed down
          const k = ease(t);
          m.el.style.opacity = String(k);
          m.el.style.transform = `scale(${1.5 - 0.5 * k})`;
        } else {
          m.el.style.opacity = String(t);
        }
      }

      const turn = ease(clamp(stage - (STAGES - 1)));
      flip.style.transform = `rotateY(${turn * 180}deg) scale(${1 - Math.sin(turn * Math.PI) * 0.08})`;
    });

    tabs.forEach((tab, i) =>
      tab.addEventListener('click', () => {
        const top = story.getBoundingClientRect().top + scrollY;
        const travel = story.offsetHeight - innerHeight;
        scrollToY(top + travel * ((i + 0.55) / STAGES));
      }),
    );
  });
}
