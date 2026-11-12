// The goods: asymmetric editorial list built from the catalog. "+ add" toggles into the kit.
import { CATALOG } from '../../data/catalog.js';
import { GOODS_META, GOODS_ORDER } from '../../data/content.js';
import { kit } from '../../kit/state.js';
import { renderPicture, esc } from '../media.js';
import { gsap, reduced } from '../motion.js';
import { icons } from '../icons.js';

const LAYOUT = ['a', 'b', 'c', 'd', 'b', 'a', 'e'];
const KIND = { Apparel: 'apparel', Headwear: 'headwear', Bag: 'bag', Drinkware: 'drinkware', Paper: 'paper' };

const customiseHref = (id, color) => `/builder.html${color ? `?color=${encodeURIComponent(color)}` : ''}#goods/${id}`;

export function initGoods() {
  const host = document.querySelector('[data-goods]');
  if (!host) return;
  const picked = {}; // colour chosen before adding

  host.innerHTML = GOODS_ORDER.map((id, i) => {
    const g = CATALOG.goods.find((x) => x.id === id);
    const m = GOODS_META[id];
    const colors = g.options.color || [];
    return `<article class="good good--${LAYOUT[i]}" data-good="${id}" aria-labelledby="good-${id}">
      <div class="good__media">
        <span class="good__num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
        <div class="good__render" data-parallax="${i % 2 ? 0.06 : 0.1}">
          ${renderPicture(m.render, { w: 1600, h: 1600, alt: m.alt, cls: 'media--contain' })}
        </div>
      </div>
      <div class="good__body" data-reveal="up">
        <p class="good__meta mono"><span>${String(i + 1).padStart(2, '0')} / 07</span><span>${KIND[g.kind] || g.kind.toLowerCase()}</span></p>
        <h3 class="display good__name" id="good-${id}">${m.label}</h3>
        <p class="good__price mono">from <b>$${g.price}</b> a kit</p>
        <p class="good__spec">${esc(m.spec)}</p>
        <div class="swatches" role="radiogroup" aria-label="${m.label} colour">
          ${colors.map((c, k) => `<button type="button" role="radio" class="swatch" data-color="${c}" aria-checked="${k === 0}" tabindex="${k === 0 ? 0 : -1}" style="--sw:${CATALOG.swatches[c] || '#ccc'}"><span class="sr-only">${c}</span></button>`).join('')}
          <span class="swatches__name mono" data-color-name>${colors[0] || ''}</span>
        </div>
        <div class="good__actions">
          <button type="button" class="btn-add" data-add="${id}" aria-pressed="false"><span class="btn-add__icon" aria-hidden="true"></span><span class="btn-add__label">add</span><span class="btn-add__on" aria-hidden="true">in the kit</span></button>
          <a class="link-arrow" data-customise="${id}" href="${customiseHref(id, colors[0])}">customise <span aria-hidden="true">${icons.arrowRight}</span></a>
        </div>
      </div>
    </article>`;
  }).join('');

  // add / remove
  host.addEventListener('click', (e) => {
    const add = e.target.closest('[data-add]');
    if (add) {
      const id = add.dataset.add;
      const wasIn = kit.has(id);
      kit.toggleGood(id, picked[id] ? { color: picked[id] } : {});
      if (!wasIn && !reduced) {
        gsap.fromTo(add, { scale: 0.92 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.45)' });
        const pill = document.querySelector('.nav [data-kit-pill]');
        if (pill) gsap.fromTo(pill, { scale: 1.12 }, { scale: 1, duration: 0.7, ease: 'elastic.out(1, 0.4)' });
      }
      return;
    }
    const sw = e.target.closest('.swatch');
    if (sw) selectColor(sw);
  });
  host.addEventListener('keydown', (e) => {
    const sw = e.target.closest('.swatch');
    if (!sw || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    e.preventDefault();
    const all = [...sw.parentElement.querySelectorAll('.swatch')];
    const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1;
    const next = all[(all.indexOf(sw) + d + all.length) % all.length];
    selectColor(next); next.focus();
  });

  function selectColor(sw) {
    const art = sw.closest('[data-good]');
    const id = art.dataset.good;
    picked[id] = sw.dataset.color;
    paintSwatches(art, sw.dataset.color);
    // carry the colour into the builder, so "customise" opens on what was picked here
    const cu = art.querySelector('[data-customise]');
    if (cu) cu.href = customiseHref(id, sw.dataset.color);
    if (kit.has(id)) kit.setOption(id, 'color', sw.dataset.color);
  }
  function paintSwatches(art, color) {
    art.querySelectorAll('.swatch').forEach((b) => {
      const on = b.dataset.color === color;
      b.setAttribute('aria-checked', String(on));
      b.tabIndex = on ? 0 : -1;
    });
    const nm = art.querySelector('[data-color-name]');
    if (nm) nm.textContent = color;
  }

  kit.subscribe((s) => {
    host.querySelectorAll('[data-good]').forEach((art) => {
      const id = art.dataset.good;
      const inKit = Boolean(s.goods[id]);
      const btn = art.querySelector('[data-add]');
      btn.setAttribute('aria-pressed', String(inKit)); // the name stays "add"; CSS swaps the visible label
      art.classList.toggle('is-in', inKit);
      if (inKit && s.goods[id].color) {
        paintSwatches(art, s.goods[id].color);
        const cu = art.querySelector('[data-customise]');
        if (cu) cu.href = customiseHref(id, s.goods[id].color);
      }
    });
  });
}
