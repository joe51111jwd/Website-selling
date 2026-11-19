// Small helpers shared by the cover files. Every cover sets window.__ready = true when its fonts are in and its
// type is fitted, and render.cjs waits for that before it takes the picture.
if (new URLSearchParams(location.search).get("guides")) document.documentElement.classList.add("guides");

// Set el's font-size so the word's ink (not its advance box) is exactly `width` px wide.
// Returns { size, capTop, capHeight, left } in px, measured on the ink, so words can be aligned to the pixel.
function fitWidth(el, width) {
  const style = getComputedStyle(el);
  const c = document.createElement("canvas").getContext("2d");
  const measure = (size) => {
    c.font = `${style.fontWeight} ${size}px ${style.fontFamily}`;
    if ("letterSpacing" in c) c.letterSpacing = style.letterSpacing;
    return c.measureText(el.textContent);
  };
  const m1 = measure(1000);
  const ink1 = m1.actualBoundingBoxLeft + m1.actualBoundingBoxRight;
  const size = (1000 * width) / ink1;
  el.style.fontSize = size + "px";
  const m = measure(size);
  return { size, capHeight: m.actualBoundingBoxAscent, left: m.actualBoundingBoxLeft, ascent: m.fontBoundingBoxAscent };
}

// Cap height of a font in em (measured on "H").
function capEm(family, weight = 400) {
  const c = document.createElement("canvas").getContext("2d");
  c.font = `${weight} 1000px ${family}`;
  return c.measureText("H").actualBoundingBoxAscent / 1000;
}

async function ready(fn) {
  await document.fonts.ready;
  await Promise.all([...document.fonts].map((f) => f.load()));
  await Promise.all([...document.images].map((im) => (im.complete ? 0 : new Promise((r) => (im.onload = im.onerror = r)))));
  if (fn) await fn();
  window.__ready = true;
}
