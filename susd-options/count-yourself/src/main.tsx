import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/fonts.css';
import './styles/base.css';
import './styles/hero.css';
import './styles/meter.css';
import './styles/cycle.css';
import './styles/paths.css';
import { App } from './App';
import { installGrain } from './grain';

installGrain();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
