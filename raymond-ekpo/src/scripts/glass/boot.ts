// The Liquid Glass renderer only loads on the glass build.
if (document.documentElement.dataset.theme === 'glass') {
  import('./engine').then((m) => m.start());
}
