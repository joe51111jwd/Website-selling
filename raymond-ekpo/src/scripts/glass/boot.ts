if (document.documentElement.dataset.theme === 'glass') {
  import('./liquid').then((m) => m.liquid());
  import('./navlens').then((m) => m.navLens());
  import('./engine').then((m) => m.start());
}
