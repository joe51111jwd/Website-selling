if (document.documentElement.dataset.theme === 'glass') {
  import('./tabs').then((m) => m.tabs());
  import('./segments').then((m) => m.segments());
  import('./engine').then((m) => m.start());
}
