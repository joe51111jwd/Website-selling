// Resolve when the display font is ready, or after 1200 ms, whichever comes first (brief S6).
let p: Promise<void> | null = null;
export function fontsReady(): Promise<void> {
  if (!p) {
    p = new Promise<void>((resolve) => {
      const t = window.setTimeout(resolve, 1200);
      const fonts = document.fonts;
      if (!fonts) {
        resolve();
        return;
      }
      Promise.all([fonts.load('900 100px "Archivo Variable"'), fonts.load('500 20px "Archivo Variable"')])
        .then(() => fonts.ready)
        .then(() => {
          window.clearTimeout(t);
          resolve();
        })
        .catch(() => resolve());
    });
  }
  return p;
}
