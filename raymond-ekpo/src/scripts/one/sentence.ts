// The one-sentence test, in the page. Every keystroke re-reads the sentence (analyse.ts) and
// updates the styled copy under the field, the checks, the line a partner would repeat, the faint
// words behind the page and the next step. The sentence is kept in this browser's session, so the
// enquiry form can start from it; it's never sent anywhere unless the founder sends the form.
import { analyse, type Reading } from './analyse';
import { track } from '../track';

const KEY = 'one-sentence';
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

export function sentence() {
  const root = document.querySelector<HTMLElement>('[data-sentence]');
  if (!root) return;
  const input = root.querySelector<HTMLTextAreaElement>('[data-input]')!;
  const mirror = root.querySelector<HTMLElement>('[data-mirror]')!;
  const keptEl = root.querySelector<HTMLElement>('[data-kept]')!;
  const passedEl = root.querySelector<HTMLElement>('[data-passed]')!;
  const live = root.querySelector<HTMLElement>('[data-live]')!;
  const verdict = root.querySelector<HTMLElement>('[data-verdict]')!;
  const ghost = document.querySelector<HTMLElement>('[data-ghost]');
  const hints: Record<string, string> = JSON.parse(root.dataset.hints ?? '{}');
  const rows = new Map([...root.querySelectorAll<HTMLElement>('[data-check]')].map((li) => [li.dataset.check!, li]));

  let last: Reading | null = null;
  let liveTimer = 0;
  let tracked = false;

  const paintMirror = (r: Reading) => {
    const kids = mirror.children;
    r.tokens.forEach((t, i) => {
      let span = kids[i] as HTMLSpanElement | undefined;
      if (!span) {
        span = document.createElement('span');
        mirror.append(span);
      }
      if (span.textContent !== t.text) span.textContent = t.text;
      const cls = t.kind === 'space' ? '' : `k-${t.kind}`;
      if (span.className !== cls) span.className = cls;
    });
    while (mirror.children.length > r.tokens.length) mirror.lastElementChild!.remove();
    // a trailing space would otherwise collapse; keep the caret's line the same height
    mirror.dataset.empty = r.tokens.length ? '' : '1';
  };

  const paintChecks = (r: Reading) => {
    for (const c of r.checks) {
      const li = rows.get(c.id)!;
      const before = li.dataset.state;
      li.dataset.state = c.state;
      const note = li.querySelector<HTMLElement>('[data-note]')!;
      const text = c.state === 'idle' ? hints[c.id] : c.note;
      if (note.textContent !== text) note.textContent = text;
      if (before !== c.state && c.state === 'pass' && !still) {
        li.classList.remove('pop');
        void li.offsetWidth;
        li.classList.add('pop');
        setTimeout(() => li.classList.remove('pop'), 420);
      }
    }
    passedEl.textContent = String(r.passed);
  };

  const paintKept = (r: Reading) => {
    keptEl.replaceChildren();
    if (!r.ready) {
      const wait = document.createElement('span');
      wait.className = 's1-wait';
      wait.textContent = r.words ? 'Keep going…' : 'Start typing. What survives will show here.';
      keptEl.append(wait);
      return;
    }
    r.kept.forEach((k, i) => {
      if (i) {
        const sep = document.createElement('span');
        sep.className = 's1-sep';
        sep.textContent = '·';
        sep.setAttribute('aria-hidden', 'true');
        keptEl.append(sep);
      }
      keptEl.append(document.createTextNode(k));
    });
    const aside = document.createElement('span');
    aside.className = 's1-aside';
    aside.textContent = ` ${r.aside}`;
    keptEl.append(aside);
  };

  const paintGhost = (r: Reading) => {
    if (!ghost) return;
    const word = r.ready
      ? [...r.kept].sort((a, b) => b.length - a.length)[0]?.split(' ').slice(0, 3).join(' ') ?? ''
      : '';
    if (ghost.textContent !== word) ghost.textContent = word;
  };

  const paintVerdict = (r: Reading) => {
    verdict.textContent = !r.ready
      ? 'What you type stays in your browser.'
      : r.passed >= 5
        ? 'That travels. Does the rest of your deck?'
        : r.passed >= 3
          ? 'Close. A second pair of eyes would get it there.'
          : 'This is exactly the part I work on.';
  };

  const render = () => {
    const text = input.value;
    const r = analyse(text);
    paintMirror(r);
    paintChecks(r);
    if (!last || last.kept.join('|') !== r.kept.join('|') || last.aside !== r.aside || last.ready !== r.ready) paintKept(r);
    paintGhost(r);
    paintVerdict(r);
    last = r;
    try {
      if (text.trim()) sessionStorage.setItem(KEY, text.trim());
      else sessionStorage.removeItem(KEY);
    } catch {
      /* storage can be off */
    }
    clearTimeout(liveTimer);
    liveTimer = window.setTimeout(() => {
      live.textContent = r.ready ? `${r.passed} of 6 checks pass. ${r.aside.replace(/^…/, '')}` : '';
      if (r.ready && !tracked) {
        tracked = true;
        track('Sentence tested');
      }
    }, 1200);
  };

  // one sentence: no new lines
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      root.querySelector<HTMLElement>('[data-send]')?.focus();
    }
  });
  input.addEventListener('input', () => {
    if (/\n/.test(input.value)) {
      const at = input.selectionStart;
      input.value = input.value.replace(/\s*\n+\s*/g, ' ');
      input.setSelectionRange(at, at);
    }
    typing = 0;
    render();
  });

  // the examples type themselves in
  let typing = 0;
  root.querySelectorAll<HTMLButtonElement>('[data-example]').forEach((b) =>
    b.addEventListener('click', () => {
      const text = b.dataset.text ?? '';
      const run = ++typing;
      if (still) {
        input.value = text;
        render();
        input.focus();
        return;
      }
      input.value = '';
      render();
      let i = 0;
      const step = () => {
        if (run !== typing) return;
        i = Math.min(text.length, i + 2 + Math.round(Math.random() * 2));
        input.value = text.slice(0, i);
        render();
        if (i < text.length) setTimeout(step, 28);
        else {
          input.focus();
          input.setSelectionRange(text.length, text.length);
        }
      };
      step();
    }),
  );

  // come back to the sentence you were working on
  try {
    const saved = sessionStorage.getItem(KEY);
    if (saved && !input.value) input.value = saved;
  } catch {
    /* storage can be off */
  }
  render();
  root.classList.add('is-live');
  // with a mouse, the cursor is already waiting in the sentence; on a phone the keyboard waits for a tap
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    input.focus({ preventScroll: true });
    input.setSelectionRange(input.value.length, input.value.length);
  }
}
