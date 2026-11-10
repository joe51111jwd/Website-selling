// How many kits: centred segmented picker, live total for the current kit, deep link into the builder.
import { kit, perKit, itemCount, money } from '../../kit/state.js';
import { segmented } from '../segmented.js';
import { odometer } from '../odometer.js';
import { SHOWN_KIT, MAILTO } from '../../data/content.js';
import { ScrollTrigger, reduced } from '../motion.js';

export function initQty() {
  const sec = document.getElementById('quantity');
  if (!sec) return;
  const seg = sec.querySelector('[data-qty-seg]');
  const math = sec.querySelector('[data-qty-math]');
  const cta = sec.querySelector('[data-qty-cta]');
  const totalEl = odometer(sec.querySelector('[data-qty-total]'), { value: 0, format: money, duration: 1000 });
  let shown = false;

  const render = () => {
    const s = kit.get();
    const q = s.qty;
    const custom = itemCount(s) > 0;
    const per = custom ? perKit(s) : SHOWN_KIT.perKit;
    const plus = q >= 120 ? '+' : '';
    if (shown || reduced) totalEl.set(per * q);
    math.textContent = `${money(per)} a kit${custom ? ', your kit' : ', as shown'} × ${q}${plus}`;
    const label = cta.querySelector('.btn__label');
    if (q >= 120) {
      cta.href = MAILTO('120+ kits', `Hi Luis, we're looking at 120+ kits (around ${money(per)} a kit). Can we talk?`);
      label.textContent = 'email luis about 120+ kits';
    } else {
      cta.href = `/builder.html?qty=${q}`;
      label.textContent = `open the builder on ${q}`;
    }
  };
  segmented(seg, { value: kit.get().qty, onChange: (v) => kit.setQty(Number(v)) });
  kit.subscribe((s) => {
    seg.querySelectorAll('[role="radio"]').forEach((r) => { const on = Number(r.dataset.value) === s.qty; r.setAttribute('aria-checked', String(on)); r.tabIndex = on ? 0 : -1; });
    seg.style.setProperty('--seg-i', [...seg.querySelectorAll('[role="radio"]')].findIndex((r) => Number(r.dataset.value) === s.qty));
    render();
  });
  ScrollTrigger.create({ trigger: sec, start: 'top 70%', once: true, onEnter: () => { shown = true; render(); } });
}
