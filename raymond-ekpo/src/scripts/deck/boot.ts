if (document.documentElement.dataset.theme === 'glass') {
  import('./deck').then((m) => m.deck());
  import('./segments').then((m) => m.segments());
  import('./compare').then((m) => m.compares());
}
