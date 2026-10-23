import postcss from "postcss";

// Writes every px length in the site's CSS as rem (px / 16), so one root font-size scales the whole
// page the way browser zoom does. At the browser's default 16px root the page is the same to the pixel;
// src/styles/tokens.css is where desktop drops the root to 90%. Left as px: hairlines (1px and under)
// and anything inside url(...) or a quoted string. Media and container query widths are at-rule
// params, not declarations, so they stay in px and keep following the real window.
const PX = /url\([^)]*\)|"[^"]*"|'[^']*'|(-?\d*\.?\d+)px(?![\w-])/gi;

export function pxToRem(value: string): string {
  return value.replace(PX, (match, n: string | undefined) => {
    if (n === undefined) return match;
    const px = parseFloat(n);
    if (Math.abs(px) <= 1) return match;
    return `${+(px / 16).toFixed(6)}rem`;
  });
}

export function pxToRemPlugin() {
  return {
    postcssPlugin: "smartcrew-px-to-rem",
    Declaration(decl: { value: string }) {
      if (decl.value.includes("px")) decl.value = pxToRem(decl.value);
    },
  };
}

/** For the pages that ship a plain stylesheet instead of going through Vite (the SEO library, the 404). */
export function pxToRemCss(css: string): string {
  return postcss([pxToRemPlugin()]).process(css, { from: undefined }).css;
}
