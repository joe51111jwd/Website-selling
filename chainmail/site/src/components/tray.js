// Kit tray drawer (index page): role="dialog", focus trap, Esc to close, live contents from kit state.
import { CATALOG } from '../data/catalog.js';
import { GOODS_META } from '../data/content.js';
import { kit, lineItems, perKit, total, money, qtyLabel, itemCount } from '../kit/state.js';
import { odometer } from './odometer.js';
import { esc, watchMedia } from './media.js';

export function initTray({ lenis } = {}) {
  const tray = document.getElementById('kit-tray');
  if (!tray) return null;
  const panel = tray.querySelector('.tray__panel');
  const list = tray.querySelector('[data-tray-list]');
  const qtyWrap = tray.querySelector('[data-tray-qty]');
  const perEl = odometer(tray.querySelector('[data-tray-per]'), { format: money });
  const totEl = odometer(tray.querySelector('[data-tray-total]'), { format: money });
  const qtyNote = tray.querySelector('[data-tray-qtynote]');
  let lastFocus = null;

  qtyWrap.innerHTML = CATALOG.quantities.filter((q) => q < 120).map((q) =>
    `<button type="button" class="chip-q" data-q="${q}" aria-pressed="false">${q}</button>`).join('');
  qtyWrap.addEventListener('click', (e) => {
    const b = e.target.closest('[data-q]');
    if (b) kit.setQty(Number(b.dataset.q));
  });

  function render(s) {
    const lines = lineItems(s);
    const goodsCount = itemCount(s);
    list.innerHTML = lines.map((l) => {
      const removable = l.key !== 'note';
      const isGood = CATALOG.goods.some((g) => g.id === l.key);
      const thumb = isGood ? `/renders/${GOODS_META[l.key].render}@half.webp`
        : l.key === 'spirit' ? `/renders/spirits/${s.spirit}@half.webp`
        : l.key === 'send-in' ? '/renders/kit/product@half.webp' : '/renders/kit/note-card@half.webp';
      return `<li class="tray__item">
        <span class="tray__thumb media" data-media><img src="${thumb}" alt="" width="64" height="64" decoding="async"></span>
        <span class="tray__meta"><span class="tray__name">${esc(l.name)}</span><span class="tray__detail">${esc(l.detail || '')}</span></span>
        <span class="tray__price mono">${l.price ? money(l.price) : 'incl.'}</span>
        ${removable ? `<button type="button" class="tray__rm" data-rm="${l.key}" aria-label="remove ${esc(l.name)}">×</button>` : '<span></span>'}
      </li>`;
    }).join('') + (goodsCount === 0 ? `<li class="tray__empty">Nothing picked yet. Tap <b>+ add</b> on anything in the goods, or start from the builder.</li>` : '');
    watchMedia(list);
    perEl.set(perKit(s));
    totEl.set(total(s));
    qtyNote.textContent = `× ${qtyLabel(s.qty)} kits`;
    qtyWrap.querySelectorAll('[data-q]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.q) === s.qty)));
  }
  kit.subscribe(render);

  list.addEventListener('click', (e) => {
    const b = e.target.closest('[data-rm]');
    if (!b) return;
    const k = b.dataset.rm;
    const idx = [...list.querySelectorAll('[data-rm]')].indexOf(b);
    if (k === 'send-in') kit.setSendIn(false);
    else if (k === 'spirit') kit.setSpirit(null);
    else kit.removeGood(k);
    // the list re-rendered and took the focused button with it: keep focus inside the dialog
    const rms = list.querySelectorAll('[data-rm]');
    (rms[Math.min(idx, rms.length - 1)] || panel.querySelector('.tray__close'))?.focus();
  });

  const focusables = () => [...panel.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')].filter((x) => x.offsetParent !== null);

  function open() {
    lastFocus = document.activeElement;
    tray.hidden = false;
    requestAnimationFrame(() => tray.classList.add('is-open'));
    document.documentElement.classList.add('tray-open');
    lenis?.stop();
    document.querySelectorAll('[data-kit-pill]').forEach((p) => p.setAttribute('aria-expanded', 'true'));
    setTimeout(() => panel.querySelector('.tray__close')?.focus(), 60);
  }
  function close() {
    tray.classList.remove('is-open');
    document.documentElement.classList.remove('tray-open');
    lenis?.start();
    document.querySelectorAll('[data-kit-pill]').forEach((p) => p.setAttribute('aria-expanded', 'false'));
    setTimeout(() => { tray.hidden = true; }, 520);
    lastFocus?.focus?.();
  }
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-kit-pill]')) { e.preventDefault(); open(); }
    if (e.target.closest('[data-tray-close]')) close();
  });
  document.addEventListener('keydown', (e) => {
    if (tray.hidden || !tray.classList.contains('is-open')) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'Tab' && !panel.contains(document.activeElement)) { e.preventDefault(); panel.querySelector('.tray__close')?.focus(); return; }
    if (e.key === 'Tab') {
      const f = focusables();
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  return { open, close };
}
