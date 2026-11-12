import '@fontsource-variable/archivo/wdth.css';
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import './styles/index.css';
import './styles/builder.css';

// gsap core only: the builder never needs ScrollTrigger, SplitText or Lenis
import { gsap, reduced } from './components/gsap-core.js';
import { icons } from './components/icons.js';
import { announceKit } from './kit/announce.js';
import { mountLogos } from './components/logo.js';
import { renderPicture, watchMedia, esc } from './components/media.js';
import { segmented } from './components/segmented.js';
import { odometer } from './components/odometer.js';
import { magnetic } from './components/magnetic.js';
import { CATALOG } from './data/catalog.js';
import { GOODS_META, GOODS_ORDER, MAILTO } from './data/content.js';
import { kit, lineItems, perKit, total, money, moneyTotal, qtyLabel, summaryText } from './kit/state.js';

const STEP_NAMES = ['quantity', 'your product', 'the goods', 'spirit', 'the note', 'review'];
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const lower = (s) => s.toLowerCase();

mountLogos();

/* ── deep links: ?qty=48, ?color=White#goods/<id>, #step-N ──────────── */
// one-shot: applied once, then dropped from the URL so a reload or a return visit never resets the kit
const params = new URLSearchParams(location.search);
const qParam = Number(params.get('qty'));
if (CATALOG.quantities.includes(qParam)) kit.setQty(qParam);
const colorParam = params.get('color');
if (params.has('qty') || params.has('color')) {
  params.delete('qty');
  params.delete('color');
  const qs = params.toString();
  history.replaceState(null, '', `${location.pathname}${qs ? `?${qs}` : ''}${location.hash}`);
}

/* ── step navigation ─────────────────────────────────────────────────── */
const panels = $$('[data-panel]');
const stepBtns = $$('[data-goto]');
const nextBtn = $('[data-b-next]');
const prevBtn = $('[data-b-prev]');
let step = -1;

function go(n, { focus = true, instant = false } = {}) {
  n = Math.max(0, Math.min(panels.length - 1, n));
  if (n === step) return;
  const next = panels[n];
  const dir = n > step ? 1 : -1;
  step = n;
  stepBtns.forEach((b, i) => {
    b.parentElement.classList.toggle('is-active', i === n);
    b.parentElement.classList.toggle('is-done', i < n);
    if (i === n) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
  });
  panels.forEach((pn) => { pn.hidden = pn !== next; });
  // narrow screens: the step strip scrolls sideways, keep the active step centred in it
  const strip = $('.b__steps');
  if (strip && strip.scrollWidth > strip.clientWidth) {
    const li = stepBtns[n].parentElement;
    const left = strip.scrollLeft + li.getBoundingClientRect().left - strip.getBoundingClientRect().left - (strip.clientWidth - li.offsetWidth) / 2;
    strip.scrollTo({ left: Math.max(0, left), behavior: reduced || instant ? 'auto' : 'smooth' });
  }
  if (!reduced && !instant) {
    // opacity, not autoAlpha: a visibility:hidden panel cannot take the heading focus below
    gsap.fromTo(next, { opacity: 0, x: 28 * dir }, { opacity: 1, x: 0, duration: 0.7, ease: 'expo.out', clearProps: 'opacity,transform' });
  }
  prevBtn.disabled = n === 0;
  prevBtn.style.visibility = n === 0 ? 'hidden' : '';
  nextBtn.hidden = n >= panels.length - 1;
  paintNext();
  document.body.classList.toggle('is-review', n === panels.length - 1);
  history.replaceState(null, '', `${location.pathname}${location.search}#step-${n + 1}`);
  if (!instant) {
    const top = $('.b__steps').getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top: Math.max(0, top), behavior: reduced ? 'auto' : 'smooth' });
  }
  if (focus) {
    const h = next.querySelector('.b__pt');
    if (h) {
      h.setAttribute('tabindex', '-1');
      h.focus({ preventScroll: true });
    }
  }
  if (n === 5) renderReview();
}
/* next button label: "next: <step>"; on 01 with 120+ the email to Luis is the main path, building on is optional */
function paintNext() {
  if (step < 0 || step >= panels.length - 1) return;
  const big = step === 0 && kit.get().qty >= 120;
  nextBtn.querySelector('.btn__label').textContent = big ? 'or continue building' : `next: ${STEP_NAMES[step + 1]}`;
  nextBtn.classList.toggle('btn--primary', !big);
  nextBtn.classList.toggle('btn--ghost', big);
}
stepBtns.forEach((b) => b.addEventListener('click', () => go(Number(b.dataset.goto))));
nextBtn.addEventListener('click', () => go(step + 1));
prevBtn.addEventListener('click', () => go(step - 1));

/* ── 01 quantity ─────────────────────────────────────────────────────── */
const qtySeg = $('[data-b-qty]');
segmented(qtySeg, { value: kit.get().qty, onChange: (v) => kit.setQty(Number(v)) });

/* ── 02 send-in ──────────────────────────────────────────────────────── */
const sendSeg = $('[data-b-sendin]');
segmented(sendSeg, { value: kit.get().sendIn ? 'yes' : 'no', onChange: (v) => kit.setSendIn(v === 'yes') });

/* ── 03 goods ────────────────────────────────────────────────────────── */
const goodsHost = $('[data-b-goods]');
const OPTION_LABEL = { color: 'colour', weight: 'weight', style: 'style', position: 'logo position' };
goodsHost.innerHTML = GOODS_ORDER.map((id) => {
  const g = CATALOG.goods.find((x) => x.id === id);
  const m = GOODS_META[id];
  const opts = Object.entries(g.options).map(([key, list]) => {
    if (key === 'color') {
      return `<div class="b__opt"><p class="b__optl mono" id="o-${id}-${key}">${OPTION_LABEL[key]} <span data-optval="${key}"></span></p>
        <div class="swatches" role="radiogroup" aria-labelledby="o-${id}-${key}" data-opt="${key}">
        ${list.map((v) => `<button type="button" role="radio" class="swatch" data-value="${v}" aria-checked="false" tabindex="-1" style="--sw:${CATALOG.swatches[v] || '#ccc'}"><span class="sr-only">${v}</span></button>`).join('')}
        </div></div>`;
    }
    return `<div class="b__opt"><p class="b__optl mono" id="o-${id}-${key}">${OPTION_LABEL[key] || key}</p>
      <div class="seg seg--sm" role="radiogroup" aria-labelledby="o-${id}-${key}" data-opt="${key}" style="--n:${list.length}">
        <span class="seg__thumb" aria-hidden="true"></span>
        ${list.map((v) => `<button type="button" role="radio" data-value="${v}" aria-checked="false" tabindex="-1">${lower(v)}</button>`).join('')}
      </div></div>`;
  }).join('');
  return `<article class="bg" id="goods-${id}" data-bgood="${id}">
    <div class="bg__thumb">${renderPicture(m.render, { w: 1600, h: 1600, alt: '', cls: 'media--contain' })}</div>
    <div class="bg__main">
      <div class="bg__top">
        <div>
          <h3 class="bg__name">${m.label}</h3>
          <p class="bg__spec">${esc(m.spec)} · <span class="mono">$${g.price}</span> a kit</p>
        </div>
        <button type="button" class="btn-add" data-bg-add="${id}" aria-pressed="false" aria-controls="opts-${id}"><span class="btn-add__icon" aria-hidden="true"></span><span class="btn-add__label">add<span class="sr-only"> ${m.label}</span></span><span class="btn-add__on" aria-hidden="true">in the kit</span></button>
      </div>
      <p class="bg__blurb">${esc(g.blurb)}</p>
      <p class="bg__added mono" aria-hidden="true">added to your kit · tap “in the kit” to take it out</p>
      <div class="bg__opts" id="opts-${id}">${opts}</div>
    </div>
  </article>`;
}).join('');

// wire option groups
$$('[data-bgood]').forEach((card) => {
  const id = card.dataset.bgood;
  $$('[data-opt]', card).forEach((grp) => {
    const key = grp.dataset.opt;
    segmented(grp, { onChange: (v) => kit.setOption(id, key, v) });
  });
});
goodsHost.addEventListener('click', (e) => {
  const b = e.target.closest('[data-bg-add]');
  if (!b) return;
  const id = b.dataset.bgAdd;
  const was = kit.has(id);
  kit.toggleGood(id);
  if (!was && !reduced) {
    const opts = $(`#opts-${id}`);
    gsap.fromTo(opts, { height: 0, autoAlpha: 0 }, { height: 'auto', autoAlpha: 1, duration: 0.6, ease: 'expo.out', clearProps: 'height' });
  }
});

/* ── 04 spirit ───────────────────────────────────────────────────────── */
const spHost = $('[data-b-spirits]');
const spItems = [...CATALOG.spirits, { id: 'none', name: 'or don’t', type: 'no bottle, no problem', proof: null, price: 0 }];
spHost.innerHTML = spItems.map((s) => `<button type="button" role="radio" class="bs${s.id === 'none' ? ' bs--none' : ''}" data-value="${s.id}" aria-checked="false" tabindex="-1">
  <span class="bs__img">${s.id === 'none' ? `<span class="bs__none" aria-hidden="true">${icons.empty}</span>` : renderPicture(`spirits/${s.id}`, { w: 800, h: 1600, alt: '', cls: 'media--contain' })}</span>
  <span class="bs__name">${lower(s.name)}</span>
  <span class="bs__type">${s.proof ? `${lower(s.type)} · ${s.proof} proof` : s.type}</span>
  <span class="bs__price mono">$${s.price}</span>
</button>`).join('');
const spSeg = segmented(spHost, { onChange: (v) => kit.setSpirit(v === 'none' ? null : v) });

/* ── 05 note ─────────────────────────────────────────────────────────── */
const note = $('[data-b-note]');
const preview = $('[data-b-preview]');
const count = $('[data-b-count]');
note.value = kit.get().note;
const PLACEHOLDER = 'Thanks for a great year. This one’s on us.';
const paintNote = () => {
  const v = note.value;
  preview.textContent = v || PLACEHOLDER;
  preview.classList.toggle('is-placeholder', !v);
  preview.style.setProperty('--fs', v.length > 180 ? 0.78 : v.length > 100 ? 0.9 : 1);
  count.textContent = `${v.length} / 280`;
};
note.addEventListener('input', () => { paintNote(); kit.setNote(note.value); });
paintNote();

/* ── 06 review ───────────────────────────────────────────────────────── */
const linesEl = $('[data-b-lines]');
const STEP_OF = (key) => (key === 'send-in' ? 1 : key === 'spirit' ? 3 : key === 'note' ? 4 : 2);
function renderReview() {
  const s = kit.get();
  linesEl.innerHTML = lineItems(s).map((l) => `<tr>
    <th scope="row"><span class="b__ln">${esc(l.label || l.name)}</span><span class="b__ld">${esc(l.detail || '')}</span></th>
    <td class="r mono">${l.price ? money(l.price) : 'incl.'}</td>
    <td class="r"><button type="button" class="b__edit" data-edit="${STEP_OF(l.key)}">edit<span class="sr-only"> ${esc(l.label || l.name)}</span></button></td>
  </tr>`).join('');
  $('[data-b-rper]').textContent = money(perKit(s));
  $('[data-b-rqty]').textContent = `× ${qtyLabel(s.qty)}`;
  const tight = (str) => str.replace(/,/g, '<span class="sep">,</span>');
  $('[data-b-rtot]').innerHTML = tight(moneyTotal(total(s), s.qty));
  $('[data-b-stot]').innerHTML = tight(moneyTotal(total(s), s.qty));
  $('[data-b-smath]').textContent = `${qtyLabel(s.qty)} kits × ${money(perKit(s))}`;
  const subject = `A kit: ${qtyLabel(s.qty)} × ${money(perKit(s))}`;
  $('[data-b-mailto]').href = MAILTO(subject, summaryText(s));
}
linesEl.addEventListener('click', (e) => { const b = e.target.closest('[data-edit]'); if (b) go(Number(b.dataset.edit)); });
$('[data-b-copy]').addEventListener('click', async () => {
  const out = $('[data-b-copied]');
  try { await navigator.clipboard.writeText(summaryText(kit.get())); out.textContent = 'Copied. Paste it anywhere Luis will see it.'; }
  catch { out.textContent = 'Couldn’t reach the clipboard — use “send it to Luis” instead.'; }
});
$('[data-b-reset]').addEventListener('click', () => {
  if (!confirm('Start over? This clears your kit.')) return;
  kit.reset(); note.value = ''; paintNote(); go(0);
});

/* ── state → UI ──────────────────────────────────────────────────────── */
const perOdo = odometer($('[data-b-per]'), { format: money, duration: 700 });
const totOdo = odometer($('[data-b-total]'), { format: (n) => moneyTotal(n, kit.get().qty), duration: 900 });
const qtyOut = $('[data-b-qtyout]');
kit.subscribe((s) => {
  // qty
  $$('[role="radio"]', qtySeg).forEach((r) => { const on = Number(r.dataset.value) === s.qty; r.setAttribute('aria-checked', String(on)); r.tabIndex = on ? 0 : -1; });
  qtySeg.style.setProperty('--seg-i', CATALOG.quantities.indexOf(s.qty));
  $('[data-b-qtycap]').textContent = s.qty >= 120 ? 'numbered 01 to 120 and beyond' : `numbered 01 to ${s.qty}`;
  $('[data-b-120]').hidden = s.qty < 120;
  $('.b__qtyvis').hidden = s.qty >= 120; // the notice takes the stack's place, right under the picker
  paintNext();
  $('[data-b-120-link]').href = MAILTO('120+ kits', summaryText(s));
  // send-in
  $$('[role="radio"]', sendSeg).forEach((r) => { const on = (r.dataset.value === 'yes') === s.sendIn; r.setAttribute('aria-checked', String(on)); r.tabIndex = on ? 0 : -1; });
  sendSeg.style.setProperty('--seg-i', s.sendIn ? 0 : 1);
  // goods
  $$('[data-bgood]').forEach((card) => {
    const id = card.dataset.bgood;
    const o = s.goods[id];
    card.classList.toggle('is-in', Boolean(o));
    const btn = $('[data-bg-add]', card);
    btn.setAttribute('aria-pressed', String(Boolean(o))); // the name stays "add <item>"; CSS swaps the visible label
    $(`#opts-${id}`, card).hidden = !o;
    const g = CATALOG.goods.find((x) => x.id === id);
    $$('[data-opt]', card).forEach((grp) => {
      const key = grp.dataset.opt;
      const val = o ? o[key] : g.options[key][0];
      const radios = $$('[role="radio"]', grp);
      radios.forEach((r) => { const on = r.dataset.value === val; r.setAttribute('aria-checked', String(on)); r.tabIndex = on ? 0 : -1; });
      grp.style.setProperty('--seg-i', radios.findIndex((r) => r.dataset.value === val));
      const out = $(`[data-optval="${key}"]`, card);
      if (out) out.textContent = `· ${lower(val)}`;
    });
  });
  // spirit
  spSeg.select(s.spirit || 'none', { emit: false });
  // bar (120+ totals carry a "+", same as the review and the email)
  perOdo.set(perKit(s));
  totOdo.set(total(s));
  qtyOut.textContent = qtyLabel(s.qty);
  if (step === 5) renderReview();
});

/* ── boot ────────────────────────────────────────────────────────────── */
watchMedia();
magnetic();
const hash = location.hash;
let start = 0;
const gm = hash.match(/^#goods\/([\w-]+)/);
const sm = hash.match(/^#step-(\d)/);
if (gm && CATALOG.goods.some((g) => g.id === gm[1])) start = 2;
else if (sm) start = Number(sm[1]) - 1;
go(start, { focus: false, instant: true });
announceKit(kit.get(), { seed: true });
kit.subscribe((s) => announceKit(s), { immediate: false });
if (gm && CATALOG.goods.some((g) => g.id === gm[1])) {
  // "customise →" from the index: the item comes in (in the colour picked there), its options open, focus lands
  // on its add toggle and the live region says what changed. The hash is already #step-3, so a reload
  // or a return visit never re-adds something the user took out here.
  const id = gm[1];
  const g = CATALOG.goods.find((x) => x.id === id);
  const color = colorParam && (g.options.color || []).includes(colorParam) ? colorParam : null;
  const added = !kit.has(id);
  if (added) kit.addGood(id, color ? { color } : {});
  else if (color) kit.setOption(id, 'color', color);
  requestAnimationFrame(() => {
    const card = document.getElementById(`goods-${id}`);
    card.classList.add('is-focus');
    card.classList.toggle('is-added', added);
    card.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
    card.querySelector('[data-bg-add]')?.focus({ preventScroll: true });
    setTimeout(() => card.classList.remove('is-focus', 'is-added'), 4200);
  });
}

// header intro
if (!reduced) {
  gsap.from('.b__head > *, .b__steps', { y: 24, autoAlpha: 0, duration: 1, ease: 'expo.out', stagger: 0.07, delay: 0.05 });
}
