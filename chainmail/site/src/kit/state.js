// Kit state, shared by index (tray + "+ add") and builder. Persisted in localStorage `chainmail.kit.v1`:
// { qty, goods: { id: { color, weight?, style?, position? } }, spirit, sendIn, note }
import { CATALOG } from '../data/catalog.js';

const KEY = 'chainmail.kit.v1';
const listeners = new Set();
const QTYS = CATALOG.quantities;

const DEFAULT = () => ({ qty: 48, goods: {}, spirit: null, sendIn: true, note: '' });

function sanitize(raw) {
  const s = DEFAULT();
  if (!raw || typeof raw !== 'object') return s;
  if (QTYS.includes(Number(raw.qty))) s.qty = Number(raw.qty);
  if (raw.goods && typeof raw.goods === 'object') {
    for (const [id, opts] of Object.entries(raw.goods)) {
      const g = CATALOG.goods.find((x) => x.id === id);
      if (g) s.goods[id] = { ...defaultOptions(g), ...pickValid(g, opts) };
    }
  }
  if (raw.spirit && CATALOG.spirits.some((x) => x.id === raw.spirit)) s.spirit = raw.spirit;
  if (typeof raw.sendIn === 'boolean') s.sendIn = raw.sendIn;
  if (typeof raw.note === 'string') s.note = raw.note.slice(0, 280);
  return s;
}

function pickValid(g, opts = {}) {
  const out = {};
  for (const [k, list] of Object.entries(g.options || {})) {
    if (opts && list.includes(opts[k])) out[k] = opts[k];
  }
  return out;
}

export function defaultOptions(g) {
  const out = {};
  for (const [k, list] of Object.entries(g.options || {})) out[k] = list[0];
  return out;
}

function read() {
  try { return sanitize(JSON.parse(localStorage.getItem(KEY))); } catch { return DEFAULT(); }
}

let state = read();

function commit(next) {
  state = sanitize(next);
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* private mode */ }
  listeners.forEach((fn) => fn(state));
}

window.addEventListener('storage', (e) => {
  if (e.key !== KEY) return;
  state = read();
  listeners.forEach((fn) => fn(state));
});

export const kit = {
  get: () => state,
  subscribe(fn, { immediate = true } = {}) {
    listeners.add(fn);
    if (immediate) fn(state);
    return () => listeners.delete(fn);
  },
  set(patch) { commit({ ...state, ...patch }); },
  setQty(qty) { commit({ ...state, qty }); },
  has: (id) => Boolean(state.goods[id]),
  addGood(id, opts = {}) {
    const g = CATALOG.goods.find((x) => x.id === id);
    if (!g) return;
    commit({ ...state, goods: { ...state.goods, [id]: { ...defaultOptions(g), ...(state.goods[id] || {}), ...pickValid(g, opts) } } });
  },
  removeGood(id) {
    const goods = { ...state.goods };
    delete goods[id];
    commit({ ...state, goods });
  },
  toggleGood(id, opts) { if (state.goods[id]) this.removeGood(id); else this.addGood(id, opts); },
  setOption(id, key, value) {
    if (!state.goods[id]) return this.addGood(id, { [key]: value });
    commit({ ...state, goods: { ...state.goods, [id]: { ...state.goods[id], [key]: value } } });
  },
  setSpirit(id) { commit({ ...state, spirit: id || null }); },
  setSendIn(v) { commit({ ...state, sendIn: Boolean(v) }); },
  setNote(note) { commit({ ...state, note }); },
  reset() { commit(DEFAULT()); },
};

/** Items in the kit for the pill: goods + spirit. */
export const itemCount = (s = state) => Object.keys(s.goods).length + (s.spirit ? 1 : 0);

export function lineItems(s = state) {
  const lines = [];
  if (s.sendIn) lines.push({ key: 'send-in', name: 'Your product, packed in', detail: 'you ship one per kit', price: CATALOG.sendIn.price });
  for (const g of CATALOG.goods) {
    const o = s.goods[g.id];
    if (!o) continue;
    const detail = [o.style, o.color, o.weight, o.position].filter(Boolean).join(' · ');
    lines.push({ key: g.id, name: g.name, detail, price: g.price });
  }
  if (s.spirit) {
    const sp = CATALOG.spirits.find((x) => x.id === s.spirit);
    lines.push({ key: 'spirit', name: sp.name, detail: `${sp.type}, 750 ml · 21+`, price: sp.price });
  }
  lines.push({ key: 'note', name: 'Printed note card', detail: s.note ? `“${s.note.slice(0, 48)}${s.note.length > 48 ? '…' : ''}”` : 'add your words in the builder', price: 0 });
  return lines;
}

export const perKit = (s = state) => lineItems(s).reduce((sum, l) => sum + l.price, 0);
export const total = (s = state) => perKit(s) * s.qty;

export const money = (n) => `$${Math.round(n).toLocaleString('en-US')}`;
export const qtyLabel = (q) => (q >= 120 ? '120+' : String(q));

export function summaryText(s = state) {
  const L = lineItems(s);
  const rows = L.map((l) => `• ${l.name}${l.detail ? ` (${l.detail})` : ''} — ${l.price ? money(l.price) : 'included'}`);
  return [
    'Hi Luis,',
    '',
    `I'd like to build a kit. Here's what I put together on chainmail.store:`,
    '',
    ...rows,
    '',
    `Per kit: ${money(perKit(s))}`,
    `Quantity: ${qtyLabel(s.qty)} kits`,
    `Estimated total: ${money(total(s))}`,
    s.note ? `\nNote card text:\n"${s.note}"` : '',
    '',
    'Recipient list to follow (shipping template with the size column).',
    '',
    'Thanks!',
  ].join('\n');
}
