import '@fontsource-variable/archivo/wdth.css';
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import './styles/index.css';
import './styles/home.css';

import { initMotion, bindAnchors, ScrollTrigger } from './components/motion.js';
import { mountLogos } from './components/logo.js';
import { watchMedia } from './components/media.js';
import { initReveals } from './components/reveal.js';
import { magnetic } from './components/magnetic.js';
import { initNav } from './components/nav.js';
import { initTray } from './components/tray.js';
import { initCursor } from './components/cursor.js';
import { initHero } from './components/sections/hero.js';
import { initMade } from './components/sections/made.js';
import { initEdition } from './components/sections/edition.js';
import { initGoods } from './components/sections/goods.js';
import { initSpirits } from './components/sections/spirits.js';
import { initWork } from './components/sections/work.js';
import { initQuotes } from './components/sections/quotes.js';
import { initQty } from './components/sections/qty.js';
import { initAccordion } from './components/sections/accordion.js';
import { loadFX } from './fxloader.js';

const lenis = initMotion();
mountLogos();

// build DOM from data first, then wire behaviour
const fxReady = loadFX();
initHero();
initEdition();
initGoods();
initSpirits(fxReady);
initWork();
initQuotes();
initQty();
initAccordion();
watchMedia();

initNav();
initTray({ lenis });
bindAnchors();
magnetic();
initCursor();

// fonts change line breaks: split + pin after they settle
document.fonts.ready.then(() => {
  initMade(fxReady);
  initReveals();
  ScrollTrigger.refresh();
});
fxReady.then((fx) => { if (fx) ScrollTrigger.refresh(); });
window.addEventListener('load', () => ScrollTrigger.refresh());
