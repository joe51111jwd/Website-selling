// Spirits: centred lineup; hovering / focusing a name brings its bottle forward; click sets the kit's spirit.
import { CATALOG } from '../../data/catalog.js';
import { SHIP_CHAIN } from '../../data/content.js';
import { kit } from '../../kit/state.js';
import { renderPicture } from '../media.js';

export function initSpirits(fxReady) {
  const sec = document.getElementById('spirits');
  if (!sec) return;
  const list = sec.querySelector('[data-spirits]');
  const solo = sec.querySelector('[data-spirit-solo]');
  const stage = sec.querySelector('[data-spirit-stage]');
  const readout = sec.querySelector('[data-spirit-readout]');
  const lower = (s) => s.toLowerCase();

  const items = [...CATALOG.spirits, { id: '', name: '(or don’t)', type: 'no bottle, no problem.', proof: null, price: 0 }];
  list.innerHTML = items.map((s, i) => `<li>
    <button type="button" class="sp" data-spirit="${s.id}" aria-pressed="false">
      <span class="sp__n mono" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
      <span class="sp__name">${lower(s.name)}</span>
      <span class="sp__type">${s.proof ? `${lower(s.type)}, ${s.proof} proof` : s.type}</span>
      <span class="sp__price mono">$${s.price}</span>
      <span class="sp__check mono" aria-hidden="true">${s.id ? 'in kit' : 'no bottle'}</span>
    </button>
  </li>`).join('');

  solo.innerHTML = CATALOG.spirits.map((s) => `<div class="spirits__bottle" data-bottle="${s.id}">
    ${renderPicture(`spirits/${s.id}`, { w: 800, h: 1600, alt: '', cls: 'media--contain' })}</div>`).join('');

  sec.querySelector('[data-chain]').innerHTML = SHIP_CHAIN.map((c, i) =>
    `<li><span class="mono chain__i">${String(i + 1).padStart(2, '0')}</span><span class="chain__t">${c}</span></li>`).join('');

  let hoverId = null;
  const show = (id) => {
    hoverId = id;
    stage.classList.toggle('is-solo', Boolean(id));
    solo.querySelectorAll('[data-bottle]').forEach((b) => b.classList.toggle('is-on', b.dataset.bottle === id));
    list.querySelectorAll('.sp').forEach((b) => b.classList.toggle('is-hot', id !== null && b.dataset.spirit === id));
    const s = CATALOG.spirits.find((x) => x.id === id);
    readout.textContent = s ? `${lower(s.name)} · ${lower(s.type)}, ${s.proof} proof · $${s.price} a kit` : '';
  };
  list.addEventListener('pointerover', (e) => { const b = e.target.closest('.sp'); if (b) show(b.dataset.spirit || null); });
  list.addEventListener('pointerleave', () => show(null));
  list.addEventListener('focusin', (e) => { const b = e.target.closest('.sp'); if (b) show(b.dataset.spirit || null); });
  list.addEventListener('focusout', (e) => { if (!list.contains(e.relatedTarget)) show(null); });
  list.addEventListener('click', (e) => {
    const b = e.target.closest('.sp');
    if (!b) return;
    const id = b.dataset.spirit || null;
    kit.setSpirit(kit.get().spirit === id ? null : id);
  });

  kit.subscribe((s) => {
    list.querySelectorAll('.sp').forEach((b) => {
      const on = (b.dataset.spirit || null) === s.spirit; // "(or don't)" reads as chosen when there is no bottle
      b.setAttribute('aria-pressed', String(on));
    });
  });

  fxReady.then((fx) => { try { fx?.setTheme?.(sec.querySelector('[data-fx="caustics"]'), 'ink'); } catch { /* optional */ } });
}
