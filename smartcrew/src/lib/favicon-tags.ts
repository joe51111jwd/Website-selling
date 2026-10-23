// The tab icon, the same on every page. Chrome and Firefox take the SVG; Safari, older browsers and
// anything that asks for /favicon.ico on its own (a browser that never read the page, a bookmark
// bar, a link preview) take the .ico in public/; the apple-touch-icon is the iPhone home-screen icon.
// A page with no icon link at all would get the host's /favicon.ico, so every page carries these.
export function iconTags(): string {
  return [
    '<link rel="icon" href="/favicon.ico" sizes="32x32" />',
    '<link rel="icon" type="image/svg+xml" href="/brand/mark.svg" />',
    '<link rel="apple-touch-icon" href="/brand/apple-touch-icon.png" />',
  ].join("\n");
}
