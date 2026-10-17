// The fit check: answers in, a drafted term sheet out. The rules are deliberately simple and
// honest: no deck means building one, a deck means a rewrite, booked meetings add Q&A
// preparation, no investor list adds research, and later rounds are told plainly.

type Svc = { id: string; title: string; price: string; min: number; max: number };

const money = (n: number) => '$' + n.toLocaleString('en-US');

// How each engagement reads inside a sentence
const SHORT: Record<string, string> = {
  rewrite: 'a pitch deck rewrite',
  creation: 'a new pitch deck',
  'qa-prep': 'Q&A preparation',
  'investor-research': 'investor research',
};

export function initFit() {
  document.querySelectorAll<HTMLElement>('[data-fit]').forEach((root) => {
    const svcs: Svc[] = JSON.parse(root.dataset.services ?? '[]');
    const byId = Object.fromEntries(svcs.map((s) => [s.id, s]));
    const email = root.dataset.email ?? '';
    const form = root.querySelector('form')!;
    const $ = <T extends HTMLElement>(sel: string) => root.querySelector<T>(sel)!;
    const status = $('[data-fit-status]');
    const title = $('[data-fit-title]');
    const lines = $('[data-fit-lines]');
    const total = $('[data-fit-total]');
    const sum = $('[data-fit-sum]');
    const verdict = $('[data-fit-verdict]');
    const ctas = $('[data-fit-ctas]');
    const go = $<HTMLAnchorElement>('[data-fit-go]');
    const audit = $('[data-fit-audit]');
    const QUESTIONS = form.querySelectorAll('fieldset').length;
    const mini = $('[data-fit-mini]');
    const miniTitle = $('[data-fit-mini-title]');
    const miniSum = $('[data-fit-mini-sum]');
    const syncMini = (answered: number) => {
      mini.hidden = answered === 0;
      miniTitle.textContent = title.textContent;
      miniSum.textContent = total.hidden ? '' : sum.textContent;
    };

    const line = (n: number, name: string, price: string, note = '', free = false) => {
      const li = document.createElement('li');
      li.className = 'fit-line' + (free ? ' fit-line--free' : '');
      li.style.setProperty('--n', String(n));
      li.innerHTML = '<b></b><i></i>' + (note ? '<small></small>' : '');
      li.querySelector('b')!.textContent = name;
      li.querySelector('i')!.textContent = price;
      if (note) li.querySelector('small')!.textContent = note;
      return li;
    };

    const render = () => {
      const a = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
      const answered = Object.keys(a).length;
      status.textContent = answered === QUESTIONS ? 'Drafted' : `Draft · ${answered} of ${QUESTIONS}`;
      lines.replaceChildren();

      if (a.round === 'later') {
        title.textContent = 'Honestly, probably not me.';
        verdict.textContent =
          'This work is built for pre-seed and seed rounds, where the story carries more of the decision than the numbers do. If you still think I can help, email me and say why.';
        lines.append(line(0, 'Series A and later', 'Outside the focus'));
        total.hidden = true;
        ctas.hidden = false;
        go.href = `mailto:${email}`;
        go.firstChild!.textContent = 'Email me anyway ';
        go.dataset.cta = 'Fit check: email';
        audit.hidden = true;
        return;
      }

      const recs: { id: string; note: string }[] = [];
      if (a.deck === 'no') recs.push({ id: 'creation', note: 'Built from the business up, thesis first.' });
      if (a.deck === 'yes') recs.push({ id: 'rewrite', note: 'Find the argument in what you already have.' });
      if (a.meetings === 'booked') recs.push({ id: 'qa-prep', note: 'Rehearse the hard questions before they’re asked.' });
      if (a.list === 'no') recs.push({ id: 'investor-research', note: 'A short list that fits your stage and sector.' });
      const picked = recs.filter((r) => byId[r.id]);

      if (!picked.length) {
        title.textContent = answered ? 'Keep going…' : 'Answer the questions to draft it.';
        for (let i = 0; i < 3; i++) {
          const ghost = document.createElement('li');
          ghost.className = 'fit-line fit-line--ghost';
          ghost.innerHTML = '<span></span><span></span>';
          lines.append(ghost);
        }
        total.hidden = true;
        ctas.hidden = true;
        verdict.textContent =
          'Each answer adds or removes a line. Nothing is sent anywhere until you choose to get in touch.';
        return;
      }

      picked.forEach((r, i) => {
        const s = byId[r.id];
        lines.append(line(i, s.title, s.price, r.note));
      });
      if (a.deck === 'yes') lines.append(line(picked.length, 'Mini-audit of your current deck', 'Complimentary', '', true));

      const min = picked.reduce((t, r) => t + byId[r.id].min, 0);
      const max = picked.reduce((t, r) => t + byId[r.id].max, 0);
      sum.textContent = min === max ? money(min) : `${money(min)}–${money(max)}`;
      total.hidden = false;

      const names = picked.map((r) => SHORT[r.id] ?? byId[r.id].title);
      const sentence =
        names.length === 1 ? `Start with ${names[0]}.` : `${names[0]}, then ${names.slice(1).join(' and ')}.`;
      title.textContent = sentence.charAt(0).toUpperCase() + sentence.slice(1);
      verdict.textContent =
        a.timing === 'later'
          ? 'You’re early, which is the best time to fix the story. Get in touch now and we can plan the work around your timeline.'
          : a.timing === 'now'
            ? 'Your timeline is tight, so the order matters: the narrative first, then everything that depends on it.'
            : 'A fixed quote comes before anything starts, and the scope is agreed in writing.';

      ctas.hidden = false;
      go.href = `/work-with-me?service=${picked.map((r) => r.id).join(',')}`;
      go.firstChild!.textContent = 'Discuss this ';
      go.dataset.cta = 'Fit check: discuss';
      audit.hidden = a.deck !== 'yes';
    };

    form.addEventListener('change', () => {
      render();
      syncMini([...new FormData(form).keys()].length);
    });
    form.addEventListener('submit', (e) => e.preventDefault());
    render();
  });
}
