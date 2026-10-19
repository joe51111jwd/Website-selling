if (document.documentElement.dataset.theme === 'glass') {
  import('./lens').then((m) => m.lensGlass());
  import('./segments').then((m) => m.segments());
  import('./sentence').then((m) => m.sentence());
  import('./compare').then((m) => m.compares());
  import('./carry').then((m) => m.carry());
}
