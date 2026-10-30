import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/base.css';
import './styles/title.css';
import './styles/sections.css';
import { App } from './App';
import { initScroll } from './scroll';
import { bakeGrain } from './grain';

const params = new URLSearchParams(window.location.search);
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const skipIntro = reduced || params.has('skipintro') || params.has('state') || params.has('section') || window.location.hash.length > 1;
if (!skipIntro) document.documentElement.classList.add('intro');
if ('scrollRestoration' in history && !window.location.hash) history.scrollRestoration = 'manual';

initScroll();
bakeGrain();
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
