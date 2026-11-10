// Rolling mono digits. Each digit is a vertical 0–9 strip translated by CSS; non-digits are static.
// The element keeps an aria-label with the formatted value; visuals are aria-hidden.
const STRIP = Array.from({ length: 10 }, (_, i) => `<span>${i}</span>`).join('');

export function odometer(el, { value = 0, format = (n) => String(n), duration = 900 } = {}) {
  el.classList.add('odo');
  el.style.setProperty('--odo-dur', `${duration}ms`);
  const vis = document.createElement('span');
  vis.className = 'odo__vis';
  vis.setAttribute('aria-hidden', 'true');
  const sr = document.createElement('span');
  sr.className = 'sr-only';
  el.replaceChildren(vis, sr);
  let current = null;

  function build(str) {
    vis.replaceChildren();
    [...str].forEach((ch) => {
      const cell = document.createElement('span');
      if (/\d/.test(ch)) {
        cell.className = 'odo__d';
        cell.innerHTML = `<span class="odo__s">${STRIP}</span>`;
        cell.firstChild.style.transform = 'translateY(0)';
      } else {
        cell.className = /[,.]/.test(ch) ? 'odo__c is-sep' : 'odo__c';
        cell.textContent = ch;
      }
      vis.appendChild(cell);
    });
  }

  function set(n, { instant = false } = {}) {
    const str = format(n);
    sr.textContent = str;
    if (current === null || current.length !== str.length || instant) {
      const prev = current;
      build(str);
      if (instant || prev === null) {
        apply(str, true);
      } else {
        // grow/shrink: start from 0s then roll
        requestAnimationFrame(() => requestAnimationFrame(() => apply(current)));
      }
    } else {
      apply(str);
    }
    current = str;
  }

  function apply(str, instant = false) {
    const cells = vis.children;
    const digitsTotal = [...str].filter((c) => /\d/.test(c)).length;
    let di = 0;
    [...str].forEach((ch, i) => {
      if (!/\d/.test(ch)) return;
      const s = cells[i] && cells[i].firstChild;
      if (!s) return;
      s.style.transitionDelay = instant ? '0ms' : `${(digitsTotal - di) * 45}ms`;
      s.style.transitionDuration = instant ? '0ms' : '';
      s.style.transform = `translateY(${-Number(ch) * 10}%)`;
      di++;
    });
  }

  set(value, { instant: true });
  return { set, get el() { return el; } };
}
