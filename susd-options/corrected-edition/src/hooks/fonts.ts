import { useEffect, useState } from 'react';

// Resolves when the fonts are ready, or after 1200 ms so a slow font never blocks the page.
export const fontsReady: Promise<void> = new Promise((resolve) => {
  const t = setTimeout(resolve, 1200);
  const f = (document as Document & { fonts?: FontFaceSet }).fonts;
  if (!f) return resolve();
  Promise.all([
    f.load('620 104px Newsreader'),
    f.load('italic 400 54px Newsreader'),
  ])
    .catch(() => {})
    .then(() => f.ready)
    .then(() => {
      clearTimeout(t);
      resolve();
    });
});

export function useFontsReady() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    let live = true;
    fontsReady.then(() => live && setOk(true));
    return () => {
      live = false;
    };
  }, []);
  return ok;
}
