// The sentence a founder wrote on the home page follows them: the services page shows it back
// with its reading, and the enquiry form starts with it in "What the company does".
import { analyse } from './analyse';

const KEY = 'one-sentence';

export function carry() {
  let text = '';
  try {
    text = sessionStorage.getItem(KEY) ?? '';
  } catch {
    return;
  }
  if (!text) return;

  document.querySelectorAll<HTMLElement>('[data-carry]').forEach((box) => {
    const r = analyse(text);
    if (!r.ready) return;
    box.querySelector<HTMLElement>('[data-carry-text]')!.textContent = `“${text}”`;
    box.querySelector<HTMLElement>('[data-carry-score]')!.textContent = `${r.passed} of 6 · ${r.aside.replace(/^…/, '')}`;
    box.hidden = false;
  });

  const field = document.querySelector<HTMLInputElement>('#f-what');
  if (field && !field.value) field.value = text;
}
