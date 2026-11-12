// Polite status message when the kit changes (WCAG 4.1.3): "cap added to your kit, 3 items, $152 per kit".
// Writes into the page's [data-kit-status] live region. The first call only records the starting state, so
// nothing is announced on page load.
import { CATALOG } from '../data/catalog.js';
import { GOODS_META } from '../data/content.js';
import { itemCount, perKit, money } from './state.js';

let prev = null;
const nameOf = (id) => GOODS_META[id]?.label || id;
const spiritName = (id) => (CATALOG.spirits.find((x) => x.id === id)?.name || id).toLowerCase();

export function announceKit(s, { seed = false } = {}) {
  const ids = Object.keys(s.goods);
  const now = { ids, spirit: s.spirit };
  const el = document.querySelector('[data-kit-status]');
  if (prev && el && !seed) {
    let msg = '';
    const added = ids.find((id) => !prev.ids.includes(id));
    const removed = prev.ids.find((id) => !ids.includes(id));
    if (added) msg = `${nameOf(added)} added to your kit`;
    else if (removed) msg = `${nameOf(removed)} removed from your kit`;
    else if (s.spirit !== prev.spirit) msg = s.spirit ? `${spiritName(s.spirit)} added to your kit` : `${spiritName(prev.spirit)} removed from your kit`;
    if (msg) {
      const n = itemCount(s);
      el.textContent = `${msg}, ${n} item${n === 1 ? '' : 's'}, ${money(perKit(s))} per kit`;
    }
  }
  prev = now;
}
