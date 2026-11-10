// <picture> builder for renders + graceful degradation (never a broken-image icon).
// Wrapper `.media` shows a skeleton until the image decodes; on error it becomes `.is-missing`
// (skeleton stays, tasteful, no alt-text box). Narrow viewports get the @half.webp.

const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/**
 * @param {string} name   manifest path without extension, e.g. 'kit/hero-open'
 * @param {object} o      { alt, w, h, lazy=true, cls, sizes, priority }
 */
export function renderPicture(name, { alt = '', w, h, lazy = true, cls = '', priority = false, half = true } = {}) {
  const src = `/renders/${name}.webp`;
  const srcHalf = `/renders/${name}@half.webp`;
  return `<picture class="media ${cls}" data-media>
    ${half ? `<source media="(max-width: 760px)" srcset="${srcHalf}" type="image/webp">` : ''}
    <img src="${src}" alt="${esc(alt)}" width="${w}" height="${h}" ${lazy ? 'loading="lazy"' : ''} decoding="async" ${priority ? 'fetchpriority="high"' : ''}>
  </picture>`;
}

/** Plain photo (public/work, already optimised). */
export function photo(src, { alt = '', w = 1080, h = 1080, lazy = true, cls = '' } = {}) {
  return `<span class="media ${cls}" data-media><img src="${src}" alt="${esc(alt)}" width="${w}" height="${h}" ${lazy ? 'loading="lazy"' : ''} decoding="async"></span>`;
}

function settle(wrap, img) {
  const ok = img.naturalWidth > 0;
  // data-fallback="kit/closed": try another manifest render before giving up (once)
  if (!ok && wrap.dataset.fallback) {
    const name = wrap.dataset.fallback;
    delete wrap.dataset.fallback;
    wrap.querySelectorAll('source').forEach((s) => s.setAttribute('srcset', `/renders/${name}@half.webp`));
    img.src = `/renders/${name}.webp`;
    return;
  }
  wrap.classList.toggle('is-loaded', ok);
  wrap.classList.toggle('is-missing', !ok);
}

/** Attach load/error tracking to every [data-media] under root (idempotent). */
export function watchMedia(root = document) {
  root.querySelectorAll('[data-media]:not([data-media-bound])').forEach((wrap) => {
    wrap.setAttribute('data-media-bound', '');
    const img = wrap.querySelector('img');
    if (!img) return;
    img.addEventListener('load', () => settle(wrap, img));
    img.addEventListener('error', () => settle(wrap, img));
    if (img.complete) settle(wrap, img);
  });
}

export { esc };
