// Accessible segmented control / radio group: role="radiogroup" with role="radio" buttons,
// roving tabindex, arrow keys / Home / End. Calls onChange(value).
export function segmented(group, { value, onChange } = {}) {
  const radios = () => [...group.querySelectorAll('[role="radio"]')];
  function select(val, { focus = false, emit = true } = {}) {
    radios().forEach((r) => {
      const on = r.dataset.value === String(val);
      r.setAttribute('aria-checked', String(on));
      r.tabIndex = on ? 0 : -1;
      if (on && focus) r.focus();
    });
    group.style.setProperty('--seg-i', radios().findIndex((r) => r.dataset.value === String(val)));
    if (emit && onChange) onChange(val);
  }
  group.addEventListener('click', (e) => {
    const r = e.target.closest('[role="radio"]');
    if (r && group.contains(r)) select(r.dataset.value);
  });
  group.addEventListener('keydown', (e) => {
    const list = radios();
    const i = list.indexOf(document.activeElement);
    if (i < 0) return;
    let n = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % list.length;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i - 1 + list.length) % list.length;
    if (e.key === 'Home') n = 0;
    if (e.key === 'End') n = list.length - 1;
    if (n === null) return;
    e.preventDefault();
    select(list[n].dataset.value, { focus: true });
  });
  if (value !== undefined) select(value, { emit: false });
  if (!radios().some((r) => r.tabIndex === 0) && radios()[0]) radios()[0].tabIndex = 0;
  return { select };
}
