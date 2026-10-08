// Clipboard with fallbacks (brief 3.10, 3.13). Owner: A6.
//
//   const r = await copyText(CONTACT_EMAIL, addressEl);
//   r === 'copied'   -> button "Copied" + announce("Address copied.")
//   r === 'selected' -> the address text is selected; button "Press Ctrl+C or ⌘C to copy"
//
// Order: the async Clipboard API (secure contexts), then a hidden-textarea execCommand('copy')
// (older Safari, http previews), then selecting the visible address so the visitor can copy it.
// Nothing is stored or sent anywhere.

export type CopyResult = 'copied' | 'selected' | 'failed';

async function viaClipboardApi(text: string): Promise<boolean> {
  try {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) return false;
    if (typeof window !== 'undefined' && window.isSecureContext === false) return false;
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function viaExecCommand(text: string): boolean {
  if (typeof document === 'undefined') return false;
  const active = document.activeElement as HTMLElement | null;
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.setAttribute('aria-hidden', 'true');
  ta.tabIndex = -1;
  // off-screen but selectable; 16px so iOS does not zoom
  ta.style.cssText =
    'position:fixed;top:0;left:0;width:1px;height:1px;padding:0;border:0;opacity:0;font-size:16px;pointer-events:none;';
  document.body.appendChild(ta);
  let ok = false;
  try {
    ta.select();
    ta.setSelectionRange(0, text.length);
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  } finally {
    ta.remove();
    window.getSelection()?.removeAllRanges();
    active?.focus?.({ preventScroll: true });
  }
  return ok;
}

/** Select the text of an element (the visible address) so Ctrl+C / ⌘C copies it. */
export function selectElementText(el: Element | null | undefined): boolean {
  if (!el || typeof window === 'undefined') return false;
  try {
    const sel = window.getSelection();
    if (!sel) return false;
    const range = document.createRange();
    range.selectNodeContents(el);
    sel.removeAllRanges();
    sel.addRange(range);
    return true;
  } catch {
    return false;
  }
}

/**
 * Copy `text`. When both programmatic paths are refused, select `fallbackEl`'s text instead
 * (the address the visitor can see) and report 'selected'.
 */
export async function copyText(text: string, fallbackEl?: Element | null): Promise<CopyResult> {
  if (await viaClipboardApi(text)) return 'copied';
  if (viaExecCommand(text)) return 'copied';
  return selectElementText(fallbackEl) ? 'selected' : 'failed';
}
