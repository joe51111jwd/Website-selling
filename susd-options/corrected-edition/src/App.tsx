import { useEffect } from 'react';
import { DEBUG } from './debug';
import { fontsReady } from './hooks/fonts';
import { Hero } from './sections/Sheet01Hero';
import { Growth } from './sections/Sheet02Growth';
import { People } from './sections/Sheet03People';
import { Equation } from './sections/Sheet04Equation';
import { Fit } from './sections/Sheet05Fit';
import { Finale } from './sections/Sheet06Finale';
import { Footer } from './sections/Footer';
import { PhoneBar } from './sections/PhoneBar';

const SHEET_IDS = ['top', 'growth', 'people', 'equation', 'fit', 'paths'];

export function App() {
  // ?sheet=N scrolls to that sheet (with every sheet's marks done).
  useEffect(() => {
    const id = DEBUG.sheet ? SHEET_IDS[DEBUG.sheet - 1] : DEBUG.finaleOpen ? 'paths' : '';
    if (!id) return;
    fontsReady.then(() =>
      requestAnimationFrame(() => {
        const el = document.getElementById(id);
        if (!el) return;
        const r = el.getBoundingClientRect();
        const vh = window.innerHeight;
        const y = window.scrollY + r.top - (r.height < vh ? (vh - r.height) / 2 : 8);
        document.documentElement.classList.add('no-snap');
        window.scrollTo({ top: Math.max(0, y), behavior: 'auto' });
        setTimeout(() => document.documentElement.classList.remove('no-snap'), 200);
      }),
    );
  }, []);

  return (
    <>
      <Hero />
      <main id="main">
        <Growth />
        <People />
        <Equation />
        <Fit />
        <Finale />
      </main>
      <Footer />
      <PhoneBar />
    </>
  );
}
